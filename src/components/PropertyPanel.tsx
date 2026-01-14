'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useTimelineStore } from '@/store/timeline';
import { formatCurrency, cn } from '@/lib/utils';
import { getPurchasePrice, calculatePurchaseIncidentalCosts, calculateImprovementCosts, calculateSellingCosts } from '@/lib/cost-base-calculations';
import {
  X,
  Edit2,
  Trash2,
  Home,
  MapPin,
  DollarSign,
  TrendingUp,
  Calendar,
  Calculator,
  FileText,
  Users,
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import DeletePropertyModal from './DeletePropertyModal';

export default function PropertyPanel() {
  const {
    selectedProperty,
    properties,
    events,
    selectProperty,
    updateProperty,
    deleteProperty
  } = useTimelineStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [isEditingOwners, setIsEditingOwners] = useState(false);
  const [owners, setOwners] = useState<{name: string; percentage: number}[]>([]);
  const [editedOwners, setEditedOwners] = useState<{name: string; percentage: number}[]>([{ name: '', percentage: 100 }]);
  const [showOwnershipSection, setShowOwnershipSection] = useState(false);

  const property = properties.find(p => p.id === selectedProperty);

  // Initialize owners state when property changes
  useEffect(() => {
    if (property?.owners && property.owners.length > 0) {
      setOwners(property.owners);
    } else {
      setOwners([{ name: '', percentage: 100 }]);
    }
  }, [property?.id, property?.owners]);
  if (!property) return null;
  
  const propertyEvents = events
    .filter(e => e.propertyId === property.id)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Calculate key metrics
  const purchaseEvent = propertyEvents.find(e => e.type === 'purchase');
  const saleEvent = propertyEvents.find(e => e.type === 'sale');
  const improvements = propertyEvents
    .filter(e => e.type === 'improvement')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  
  const totalInvestment = (purchaseEvent?.amount || 0) + improvements;
  const capitalGain = saleEvent ? (saleEvent.amount || 0) - totalInvestment : null;

  // Calculate total cost base for CGT using helper functions
  // This correctly handles both legacy events (event.amount) and new events (costBases array)
  const calculateCostBase = () => {
    const improvementEvents = propertyEvents.filter(e => e.type === 'improvement');

    return getPurchasePrice(purchaseEvent) +
           calculatePurchaseIncidentalCosts(purchaseEvent) +
           calculateImprovementCosts(improvementEvents) +
           calculateSellingCosts(saleEvent);
  };

  const totalCostBase = calculateCostBase();

  // Group all cost bases by category for display
  const groupCostBasesByCategory = () => {
    const grouped: Record<string, Array<{name: string; amount: number; eventTitle?: string}>> = {
      element1: [],
      element2: [],
      element3: [],
      element4: [],
      element5: [],
    };

    propertyEvents.forEach(event => {
      if (event.costBases && event.costBases.length > 0) {
        event.costBases.forEach(cb => {
          grouped[cb.category].push({
            name: cb.name,
            amount: cb.amount,
            eventTitle: event.title,
          });
        });
      }
    });

    return grouped;
  };

  const groupedCostBases = groupCostBasesByCategory();
  
  // Calculate ownership period
  const ownershipDays = purchaseEvent && saleEvent
    ? Math.floor((saleEvent.date.getTime() - purchaseEvent.date.getTime()) / (1000 * 60 * 60 * 24))
    : purchaseEvent
    ? Math.floor((new Date().getTime() - purchaseEvent.date.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  const ownershipYears = Math.floor(ownershipDays / 365);
  const ownershipMonths = Math.floor((ownershipDays % 365) / 30);
  
  const handleStartEditing = () => {
    setEditedName(property.name);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editedName.trim() !== '') {
      updateProperty(property.id, { name: editedName });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedName('');
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    deleteProperty(property.id);
    selectProperty(null);
    setShowDeleteModal(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  // Ownership handlers
  const handleAddOwner = () => {
    setOwners([...owners, { name: '', percentage: 0 }]);
  };

  const handleRemoveOwner = (index: number) => {
    if (owners.length > 1) {
      setOwners(owners.filter((_, i) => i !== index));
    }
  };

  const handleOwnerChange = (index: number, field: 'name' | 'percentage', value: string | number) => {
    const newOwners = [...owners];
    if (field === 'percentage') {
      newOwners[index].percentage = typeof value === 'string' ? parseFloat(value) || 0 : value;
    } else {
      newOwners[index].name = value as string;
    }
    setOwners(newOwners);
  };

  const handleSaveOwners = () => {
    const validOwners = owners.filter(o => o.name.trim() !== '' || o.percentage > 0);
    updateProperty(property.id, { owners: validOwners.length > 0 ? validOwners : undefined });
    setIsEditingOwners(false);
  };

  const totalOwnershipPercentage = owners.reduce((sum, o) => sum + o.percentage, 0);
  const isOwnershipValid = Math.abs(totalOwnershipPercentage - 100) < 0.01;
  const hasMultipleOwners = property.owners && property.owners.length > 1;

  return (
    <AnimatePresence>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4"
        onClick={() => selectProperty(null)}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 z-10">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: property.color }}
              />
              {isEditing ? (
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={handleSaveEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveEdit();
                    } else if (e.key === 'Escape') {
                      handleCancelEdit();
                    }
                  }}
                  className="text-lg font-bold border-b border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 outline-none min-w-0 flex-1"
                  autoFocus
                />
              ) : (
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 min-w-0 truncate">{property.name}</h2>
              )}
              <button
                onClick={handleStartEditing}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded flex-shrink-0"
              >
                <Edit2 className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={handleDeleteClick}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
                title="Delete Property"
              >
                <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={() => selectProperty(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
          </div>


          {property.address && (
            <div className="flex items-center gap-2 mt-2 text-sm text-slate-600 dark:text-slate-400">
              <MapPin className="w-3 h-3" />
              <span>{property.address}</span>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-4 space-y-4">
          {/* Owner Percentage Section - Collapsible */}
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
            <button
              type="button"
              onClick={() => setShowOwnershipSection(!showOwnershipSection)}
              className="flex items-center gap-2 w-full text-orange-700 dark:text-orange-300 hover:text-orange-900 dark:hover:text-orange-100 transition-colors"
            >
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                showOwnershipSection && "rotate-180"
              )} />
              <Users className="w-4 h-4" />
              <span className="text-sm font-semibold">Owner Percentage</span>
              {property.owners && property.owners.length > 0 && !showOwnershipSection && (
                <span className="ml-auto text-xs bg-orange-100 dark:bg-orange-800 px-2 py-0.5 rounded-full font-semibold">
                  {property.owners.length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showOwnershipSection && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-3"
                >
                  {!isEditingOwners && (!property.owners || property.owners.length === 0) ? (
                    // No owners yet - show Add Owner button
                    <div className="text-center py-3">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        Add owner details and ownership percentages
                      </p>
                      <button
                        onClick={() => {
                          setEditedOwners([{ name: '', percentage: 100 }]);
                          setIsEditingOwners(true);
                        }}
                        className="px-4 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-800 rounded-lg border border-orange-300 dark:border-orange-700 transition-colors"
                      >
                        + Add Owner
                      </button>
                    </div>
                  ) : !isEditingOwners ? (
                    // Display mode - show existing owners
                    <>
                      <div className="space-y-2">
                        {property.owners?.map((owner, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-orange-800 dark:text-orange-200 font-medium">
                              {owner.name}
                            </span>
                            <span className="text-orange-900 dark:text-orange-100 font-bold">
                              {owner.percentage.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-2 pt-2 border-t border-orange-200 dark:border-orange-700">
                        <p className="text-xs text-orange-600 dark:text-orange-300">
                          ✓ Total: {property.owners?.reduce((sum, o) => sum + o.percentage, 0).toFixed(1)}%
                        </p>
                      </div>
                    </>
                  ) : (
                    // Edit mode
                    <div className="space-y-3">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Enter owner names and ownership percentages. Total must equal 100%.
                      </p>

                      {editedOwners.map((owner, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                              Owner {index + 1} Name
                            </label>
                            <input
                              type="text"
                              value={owner.name}
                              onChange={(e) => {
                                const newOwners = [...editedOwners];
                                newOwners[index].name = e.target.value;
                                setEditedOwners(newOwners);
                              }}
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="e.g., Alex Smith"
                            />
                          </div>
                          <div className="w-28">
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                              % Owned
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={owner.percentage}
                              onChange={(e) => {
                                const newOwners = [...editedOwners];
                                newOwners[index].percentage = parseFloat(e.target.value) || 0;
                                setEditedOwners(newOwners);
                              }}
                              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder="50"
                            />
                          </div>
                          {editedOwners.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newOwners = editedOwners.filter((_, i) => i !== index);
                                setEditedOwners(newOwners);
                              }}
                              className="mt-6 p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              title="Remove owner"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => setEditedOwners([...editedOwners, { name: '', percentage: 0 }])}
                        className="w-full px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg border border-blue-300 dark:border-blue-700 transition-colors"
                      >
                        + Add Another Owner
                      </button>

                      {/* Ownership percentage validation */}
                      <div className="p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600">
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Total ownership:
                        </p>
                        <p className={`text-lg font-bold ${
                          Math.abs(editedOwners.reduce((sum, o) => sum + o.percentage, 0) - 100) < 0.01
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {editedOwners.reduce((sum, o) => sum + o.percentage, 0).toFixed(2)}%
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {Math.abs(editedOwners.reduce((sum, o) => sum + o.percentage, 0) - 100) < 0.01
                            ? '✓ Ownership percentages are valid'
                            : '⚠️ Must equal 100%'}
                        </p>
                      </div>

                      {/* Save/Cancel buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const totalPercentage = editedOwners.reduce((sum, o) => sum + o.percentage, 0);
                            const validOwners = editedOwners.filter(o => o.name.trim() !== '' && o.percentage > 0);

                            if (validOwners.length === 0) {
                              alert('Please add at least one owner with a name and percentage');
                              return;
                            }

                            if (Math.abs(totalPercentage - 100) > 0.01) {
                              alert(`Ownership percentages must equal 100% (currently ${totalPercentage.toFixed(2)}%)`);
                              return;
                            }

                            updateProperty(property.id, { owners: validOwners });
                            setIsEditingOwners(false);
                          }}
                          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setIsEditingOwners(false)}
                          className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 font-medium rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </div>

          {/* Key Metrics */}
          <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-medium">Purchase Price</span>
              </div>
              {purchaseEvent ? (
                <>
                  <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(purchaseEvent.amount || 0)}
                  </div>
                  {(purchaseEvent.landPrice !== undefined || purchaseEvent.buildingPrice !== undefined) && (
                    <div className="text-[10px] text-blue-700 dark:text-blue-300 mt-1 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Land:</span>
                        <span className="font-semibold">{formatCurrency(purchaseEvent.landPrice || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Building:</span>
                        <span className="font-semibold">{formatCurrency(purchaseEvent.buildingPrice || 0)}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-lg font-bold text-blue-900 dark:text-blue-100">-</div>
              )}
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">Current Value</span>
              </div>
              <div className="text-lg font-bold text-green-900 dark:text-green-100">
                {property.currentValue ? formatCurrency(property.currentValue) : '-'}
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                <Calculator className="w-4 h-4" />
                <span className="text-xs font-medium">Total Investment</span>
              </div>
              <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                {formatCurrency(totalInvestment)}
              </div>
            </div>

            <div className={`p-3 rounded-lg border ${capitalGain && capitalGain > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'}`}>
              <div className={`flex items-center gap-2 mb-1 ${capitalGain && capitalGain > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-medium">Capital Gain</span>
              </div>
              <div className={`text-lg font-bold ${capitalGain && capitalGain > 0 ? 'text-emerald-900 dark:text-emerald-100' : 'text-red-900 dark:text-red-100'}`}>
                {capitalGain ? formatCurrency(capitalGain) : '-'}
              </div>
            </div>
          </div>

          {/* Ownership Section */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700 overflow-hidden">
            <button
              onClick={() => setShowOwnershipSection(!showOwnershipSection)}
              className="w-full p-3 flex items-center justify-between hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            >
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Ownership {hasMultipleOwners && `(${property.owners?.length} owners)`}
                </span>
              </div>
              {showOwnershipSection ? (
                <ChevronUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              )}
            </button>

            {showOwnershipSection && (
              <div className="px-4 py-3 border-t border-amber-200 dark:border-amber-700">
                {!isEditingOwners ? (
                  <div className="space-y-3">
                    {property.owners && property.owners.length > 0 ? (
                      property.owners.map((owner, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm py-1">
                          <span className="text-amber-800 dark:text-amber-200">{owner.name || 'Owner ' + (idx + 1)}</span>
                          <span className="font-semibold text-amber-900 dark:text-amber-100">{owner.percentage}%</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-amber-600 dark:text-amber-400 py-1">Single owner (100%)</p>
                    )}
                    <button
                      onClick={() => setIsEditingOwners(true)}
                      className="mt-3 flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-200 bg-amber-100 dark:bg-amber-800/40 hover:bg-amber-200 dark:hover:bg-amber-800/60 border border-amber-300 dark:border-amber-600 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit ownership
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {owners.map((owner, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <input
                          type="text"
                          value={owner.name}
                          onChange={(e) => handleOwnerChange(idx, 'name', e.target.value)}
                          placeholder="Owner name"
                          className="flex-1 px-3 py-2 text-sm border border-amber-300 dark:border-amber-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        />
                        <input
                          type="number"
                          value={owner.percentage}
                          onChange={(e) => handleOwnerChange(idx, 'percentage', e.target.value)}
                          placeholder="%"
                          min="0"
                          max="100"
                          className="w-24 px-3 py-2 text-sm border border-amber-300 dark:border-amber-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        />
                        <span className="text-sm text-amber-700 dark:text-amber-300">%</span>
                        {owners.length > 1 && (
                          <button
                            onClick={() => handleRemoveOwner(idx)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      onClick={handleAddOwner}
                      className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 py-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add owner
                    </button>

                    <div className={`text-sm font-medium py-2 ${isOwnershipValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      Total: {totalOwnershipPercentage}% {!isOwnershipValid && '(must equal 100%)'}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleSaveOwners}
                        disabled={!isOwnershipValid}
                        className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setOwners(property.owners || [{ name: '', percentage: 100 }]);
                          setIsEditingOwners(false);
                        }}
                        className="px-4 py-2 text-sm border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cost Base Breakdown for CGT - NEW: Using dynamic costBases array */}
          {(purchaseEvent || totalCostBase > 0) && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-700 dark:border-indigo-800">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-200 dark:text-indigo-300 mb-3">
                <Calculator className="w-4 h-4" />
                <span className="text-sm font-semibold">Cost Base for CGT</span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Purchase Price (separate from cost bases) */}
                {purchaseEvent?.amount && (
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-600 dark:text-indigo-300">Purchase Price</span>
                    <span className="font-semibold text-indigo-900 dark:text-indigo-100">{formatCurrency(purchaseEvent.amount)}</span>
                  </div>
                )}

                {/* Element 1: Acquisition Costs (from costBases) */}
                {groupedCostBases.element1.length > 0 && (
                  <>
                    <div className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase pt-2 border-t border-indigo-200">Acquisition Costs</div>
                    {groupedCostBases.element1.map((cb, idx) => (
                      <div key={`e1-${idx}`} className="flex justify-between items-center pl-2">
                        <span className="text-indigo-600 dark:text-indigo-300 truncate">{cb.name}</span>
                        <span className="font-semibold text-indigo-900 dark:text-indigo-100">{formatCurrency(cb.amount)}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* Element 2: Incidental Costs */}
                {groupedCostBases.element2.length > 0 && (
                  <>
                    <div className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase pt-2 border-t border-indigo-200">Incidental Costs</div>
                    {groupedCostBases.element2.map((cb, idx) => (
                      <div key={`e2-${idx}`} className="flex justify-between items-center pl-2">
                        <span className="text-indigo-600 dark:text-indigo-300 truncate">{cb.name}</span>
                        <span className="font-semibold text-indigo-900 dark:text-indigo-100">{formatCurrency(cb.amount)}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* Element 3: Holding Costs */}
                {groupedCostBases.element3.length > 0 && (
                  <>
                    <div className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase pt-2 border-t border-indigo-200">Holding Costs</div>
                    {groupedCostBases.element3.map((cb, idx) => (
                      <div key={`e3-${idx}`} className="flex justify-between items-center pl-2">
                        <span className="text-indigo-600 dark:text-indigo-300 truncate">{cb.name}</span>
                        <span className="font-semibold text-indigo-900 dark:text-indigo-100">{formatCurrency(cb.amount)}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* Element 4: Capital Improvements */}
                {groupedCostBases.element4.length > 0 && (
                  <>
                    <div className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase pt-2 border-t border-indigo-200">Capital Improvements</div>
                    {groupedCostBases.element4.map((cb, idx) => (
                      <div key={`e4-${idx}`} className="flex justify-between items-center pl-2">
                        <span className="text-indigo-600 dark:text-indigo-300 truncate">{cb.name}</span>
                        <span className="font-semibold text-indigo-900 dark:text-indigo-100">{formatCurrency(cb.amount)}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* Element 5: Title Costs */}
                {groupedCostBases.element5.length > 0 && (
                  <>
                    <div className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase pt-2 border-t border-indigo-200">Title Costs</div>
                    {groupedCostBases.element5.map((cb, idx) => (
                      <div key={`e5-${idx}`} className="flex justify-between items-center pl-2">
                        <span className="text-indigo-600 dark:text-indigo-300 truncate">{cb.name}</span>
                        <span className="font-semibold text-indigo-900 dark:text-indigo-100">{formatCurrency(cb.amount)}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* Total Cost Base */}
                <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-indigo-300">
                  <span className="font-bold text-indigo-700 dark:text-indigo-200">Total Cost Base</span>
                  <span className="font-bold text-lg text-indigo-900 dark:text-indigo-100">{formatCurrency(totalCostBase)}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Ownership Period */}
          <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Ownership Period</span>
            </div>
            <div className="text-slate-800 dark:text-slate-200">
              {ownershipYears > 0 && <span className="font-bold">{ownershipYears} years </span>}
              {ownershipMonths > 0 && <span className="font-bold">{ownershipMonths} months</span>}
              {ownershipDays > 0 && ownershipYears === 0 && ownershipMonths === 0 && (
                <span className="font-bold">{ownershipDays} days</span>
              )}
              {ownershipDays === 0 && <span className="text-slate-500 dark:text-slate-400">Not yet purchased</span>}
            </div>
            {ownershipDays > 365 && (
              <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">
                ✓ Eligible for 50% CGT discount
              </div>
            )}
          </div>


          {/* Events Timeline */}
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Event History
            </h3>
            <div className="space-y-2">
              {propertyEvents.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  No events yet. Click on the timeline to add events.
                </p>
              ) : (
                propertyEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative pl-8 pb-4"
                  >
                    {/* Connection line */}
                    {index < propertyEvents.length - 1 && (
                      <div className="absolute left-3 top-6 w-0.5 h-full bg-slate-200 dark:bg-slate-700" />
                    )}

                    {/* Event dot */}
                    <div
                      className="absolute left-2 top-2 w-2 h-2 rounded-full"
                      style={{ backgroundColor: event.color }}
                    />

                    {/* Event content */}
                    <div className="bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-slate-800 dark:text-slate-100">
                          {event.title}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {format(event.date, 'dd MMM yyyy')}
                        </span>
                      </div>
                      {event.amount && (
                        <>
                          <div className="text-sm font-bold" style={{ color: event.color }}>
                            {formatCurrency(event.amount)}
                          </div>
                          {/* Show land/building breakdown for purchases if available */}
                          {event.type === 'purchase' && (event.landPrice !== undefined || event.buildingPrice !== undefined) && (
                            <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 space-y-0.5 border-t border-slate-100 dark:border-slate-600 pt-1">
                              <div className="flex justify-between">
                                <span>Land:</span>
                                <span className="font-semibold">{formatCurrency(event.landPrice || 0)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Building:</span>
                                <span className="font-semibold">{formatCurrency(event.buildingPrice || 0)}</span>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      {event.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
        </div>
      </motion.div>
      </div>

      {/* Delete Property Modal */}
      {showDeleteModal && (
        <DeletePropertyModal
          property={property}
          events={propertyEvents}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </AnimatePresence>
  );
}
