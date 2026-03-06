'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, ChevronDown, ChevronUp, Plus, Tag, Zap, Loader2 } from 'lucide-react';
import { useTimelineStore } from '@/store/timeline';
import { cn } from '@/lib/utils';
import { extractMetadataFromReport } from '@/lib/extract-report-metadata';
import {
  saveScenario,
  updateScenario,
  getSavedScenario,
  getUsedCategories,
  getUsedSubcategories,
  getAllSavedScenarios,
  SavedScenarioMetadata,
  SavedScenario,
} from '@/lib/saved-scenarios';

interface SaveScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (scenarioId: string) => void;
  editingScenarioId: string | null;
}

// Static categories from the manifest for autocomplete
const STATIC_CATEGORIES = [
  'Main Residence',
  'Ownership Changes',
  'Subdivision',
  'Multi-Property Portfolios',
  'Foreign Resident',
  'Special Rules & Exemptions',
];

export default function SaveScenarioModal({ isOpen, onClose, onSaved, editingScenarioId }: SaveScenarioModalProps) {
  const { properties, events, aiResponse } = useTimelineStore();
  const [mounted, setMounted] = useState(false);
  const [populatedFlash, setPopulatedFlash] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cachedScenarios, setCachedScenarios] = useState<SavedScenario[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [userQuery, setUserQuery] = useState('Please analyze my property portfolio with accurate CGT calculations including all cost base elements.');
  const [showExpectedResult, setShowExpectedResult] = useState(false);
  const [exemptionType, setExemptionType] = useState('');
  const [exemptionPercentage, setExemptionPercentage] = useState('');
  const [capitalGain, setCapitalGain] = useState('');
  const [taxableGain, setTaxableGain] = useState('');
  const [netCapitalGain, setNetCapitalGain] = useState('');
  const [cgtPayable, setCgtPayable] = useState('');
  const [expectedNotes, setExpectedNotes] = useState('');
  const [applicableRules, setApplicableRules] = useState<string[]>([]);
  const [ruleInput, setRuleInput] = useState('');

  // Combobox state
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [showSubcategorySuggestions, setShowSubcategorySuggestions] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const subcategoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Load editing scenario data + fetch cached scenarios for category suggestions
  useEffect(() => {
    if (isOpen) {
      // Fetch all scenarios for category/subcategory suggestions
      getAllSavedScenarios().then(setCachedScenarios).catch(() => {});

      if (editingScenarioId) {
        (async () => {
          const scenario = await getSavedScenario(editingScenarioId);
          if (scenario) {
            setTitle(scenario.title);
            setDescription(scenario.description || '');
            setCategory(scenario.category || '');
            setSubcategory(scenario.subcategory || '');
            setTags(scenario.tags || []);
            setUserQuery(scenario.userQuery || '');
            setApplicableRules(scenario.applicableRules || []);
            if (scenario.expectedResult) {
              setShowExpectedResult(true);
              setExemptionType(scenario.expectedResult.exemption_type || '');
              setExemptionPercentage(scenario.expectedResult.exemption_percentage?.toString() || '');
              setCapitalGain(scenario.expectedResult.capital_gain?.toString() || '');
              setTaxableGain(scenario.expectedResult.taxable_gain?.toString() || '');
              setNetCapitalGain(scenario.expectedResult.net_capital_gain?.toString() || '');
              setCgtPayable(scenario.expectedResult.cgt_payable?.toString() || '');
              setExpectedNotes(scenario.expectedResult.notes || '');
            } else {
              resetExpectedResult();
            }
          }
        })();
      } else {
        // Create mode — reset form
        setTitle('');
        setDescription(properties.length > 0 ? `${properties.length} propert${properties.length === 1 ? 'y' : 'ies'} scenario` : '');
        setCategory('');
        setSubcategory('');
        setTags([]);
        setTagInput('');
        setUserQuery('Please analyze my property portfolio with accurate CGT calculations including all cost base elements.');
        setApplicableRules([]);
        setRuleInput('');
        resetExpectedResult();
      }
    }
  }, [isOpen, editingScenarioId, properties.length]);

  const resetExpectedResult = () => {
    setShowExpectedResult(false);
    setExemptionType('');
    setExemptionPercentage('');
    setCapitalGain('');
    setTaxableGain('');
    setNetCapitalGain('');
    setCgtPayable('');
    setExpectedNotes('');
  };

  // Category suggestions: merge static + saved
  const allCategories = useMemo(() => {
    const saved = getUsedCategories(cachedScenarios);
    const merged = new Set([...STATIC_CATEGORIES, ...saved]);
    return Array.from(merged).sort();
  }, [cachedScenarios]);

  const filteredCategories = useMemo(() => {
    if (!category) return allCategories;
    return allCategories.filter(c => c.toLowerCase().includes(category.toLowerCase()));
  }, [category, allCategories]);

  // Subcategory suggestions based on selected category
  const allSubcategories = useMemo(() => {
    return getUsedSubcategories(cachedScenarios, category || undefined);
  }, [category, cachedScenarios]);

  const filteredSubcategories = useMemo(() => {
    if (!subcategory) return allSubcategories;
    return allSubcategories.filter(s => s.toLowerCase().includes(subcategory.toLowerCase()));
  }, [subcategory, allSubcategories]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setShowCategorySuggestions(false);
      }
      if (subcategoryRef.current && !subcategoryRef.current.contains(e.target as Node)) {
        setShowSubcategorySuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // Check if AI response has analysis data that can be extracted
  // The aiResponse is typed as AIResponse but at runtime may hold the full JSON response
  const hasReportData = !!aiResponse && (() => {
    const r = aiResponse as any;
    return (
      r?.data?.data?.properties?.length > 0 ||
      r?.data?.properties?.length > 0 ||
      (r?.properties?.length > 0 && r?.properties?.[0]?.property_address)
    );
  })();

  const handlePopulateFromReport = () => {
    if (!aiResponse) return;
    const extracted = extractMetadataFromReport(aiResponse);

    // Populate description (don't overwrite title, category, subcategory, tags)
    if (extracted.description) setDescription(extracted.description);
    if (extracted.userQuery) setUserQuery(extracted.userQuery);

    // Populate expected results
    if (extracted.expectedResult) {
      setShowExpectedResult(true);
      const er = extracted.expectedResult;
      if (er.exemption_type) setExemptionType(er.exemption_type);
      if (er.exemption_percentage !== undefined) setExemptionPercentage(er.exemption_percentage.toString());
      if (er.capital_gain !== undefined) setCapitalGain(er.capital_gain.toString());
      if (er.taxable_gain !== undefined) setTaxableGain(er.taxable_gain.toString());
      if (er.net_capital_gain !== undefined) setNetCapitalGain(er.net_capital_gain.toString());
      if (er.cgt_payable !== undefined) setCgtPayable(er.cgt_payable.toString());
      if (er.notes) setExpectedNotes(er.notes);
    }

    // Populate applicable rules
    if (extracted.applicableRules && extracted.applicableRules.length > 0) {
      setApplicableRules(extracted.applicableRules);
    }

    // Flash indicator
    setPopulatedFlash(true);
    setTimeout(() => setPopulatedFlash(false), 2000);
  };

  const handleAddRule = () => {
    const trimmed = ruleInput.trim();
    if (trimmed && !applicableRules.includes(trimmed)) {
      setApplicableRules([...applicableRules, trimmed]);
    }
    setRuleInput('');
  };

  const handleRemoveRule = (rule: string) => {
    setApplicableRules(applicableRules.filter(r => r !== rule));
  };

  const handleSubmit = async () => {
    if (!title.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const metadata: SavedScenarioMetadata = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        subcategory: subcategory.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        userQuery: userQuery.trim() || undefined,
        applicableRules: applicableRules.length > 0 ? applicableRules : undefined,
      };

      // Build expected result if any field is filled
      if (showExpectedResult) {
        const result: any = {};
        if (exemptionType) result.exemption_type = exemptionType;
        if (exemptionPercentage) result.exemption_percentage = parseFloat(exemptionPercentage);
        if (capitalGain) result.capital_gain = parseFloat(capitalGain);
        if (taxableGain) result.taxable_gain = parseFloat(taxableGain);
        if (netCapitalGain) result.net_capital_gain = parseFloat(netCapitalGain);
        if (cgtPayable) result.cgt_payable = parseFloat(cgtPayable);
        if (expectedNotes) result.notes = expectedNotes;
        if (Object.keys(result).length > 0) {
          metadata.expectedResult = result;
        }
      }

      if (editingScenarioId) {
        // Update metadata only (timeline data stays the same unless "Update Scenario" was clicked)
        const updated = await updateScenario(editingScenarioId, metadata);
        if (updated) {
          onSaved(editingScenarioId);
        }
      } else {
        // Create new scenario — use exportShareableData to capture full state including analysis
        const { exportShareableData, saveCurrentAnalysis, aiResponse: currentAI } = useTimelineStore.getState();
        if (currentAI) saveCurrentAnalysis();
        const scenarioData = exportShareableData();
        const saved = await saveScenario(metadata, scenarioData);
        if (saved) {
          onSaved(saved.id);
        }
      }
    } catch (error) {
      console.error('❌ Failed to save scenario:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999]"
          />

          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="w-full max-w-2xl max-h-[90vh] flex flex-col"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-500">
                      <Save className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {editingScenarioId ? 'Edit Scenario' : 'Save as Scenario'}
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {editingScenarioId ? 'Update scenario metadata' : 'Save your timeline as a reusable scenario'}
                      </p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>

                {/* Form - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {/* Populate from Report */}
                  {hasReportData && (
                    <button
                      onClick={handlePopulateFromReport}
                      className={cn(
                        'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border',
                        populatedFlash
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                          : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                      )}
                    >
                      <Zap className="w-4 h-4" />
                      {populatedFlash ? 'Fields populated from report' : 'Populate from Report'}
                    </button>
                  )}

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. ATO Example 42 - Main Residence with Rental Period"
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Brief description of this scenario..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 resize-none"
                    />
                  </div>

                  {/* Category + Subcategory */}
                  <div className="grid grid-cols-2 gap-4">
                    <div ref={categoryRef} className="relative">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                      <input
                        type="text"
                        value={category}
                        onChange={e => { setCategory(e.target.value); setShowCategorySuggestions(true); }}
                        onFocus={() => setShowCategorySuggestions(true)}
                        placeholder="Type or select..."
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                      />
                      {showCategorySuggestions && filteredCategories.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {filteredCategories.map(cat => (
                            <button
                              key={cat}
                              onClick={() => { setCategory(cat); setShowCategorySuggestions(false); setSubcategory(''); }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div ref={subcategoryRef} className="relative">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subcategory</label>
                      <input
                        type="text"
                        value={subcategory}
                        onChange={e => { setSubcategory(e.target.value); setShowSubcategorySuggestions(true); }}
                        onFocus={() => setShowSubcategorySuggestions(true)}
                        placeholder="Type or select..."
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                      />
                      {showSubcategorySuggestions && filteredSubcategories.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {filteredSubcategories.map(sub => (
                            <button
                              key={sub}
                              onClick={() => { setSubcategory(sub); setShowSubcategorySuggestions(false); }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
                            >
                              {sub}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tags</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {tags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                          <Tag className="w-3 h-3" />
                          {tag}
                          <button onClick={() => handleRemoveTag(tag)} className="ml-0.5 hover:text-blue-900 dark:hover:text-blue-100">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                        placeholder="Add tag and press Enter..."
                        className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                      />
                      <button onClick={handleAddTag} className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* User Query */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CGT Question / User Query</label>
                    <textarea
                      value={userQuery}
                      onChange={e => setUserQuery(e.target.value)}
                      placeholder="The CGT question to analyze..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 resize-none"
                    />
                  </div>

                  {/* Expected Result (Collapsible) */}
                  <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setShowExpectedResult(!showExpectedResult)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Expected Results</span>
                      {showExpectedResult ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>
                    {showExpectedResult && (
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Exemption Type</label>
                            <input
                              type="text"
                              value={exemptionType}
                              onChange={e => setExemptionType(e.target.value)}
                              placeholder="full, partial, none..."
                              className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Exemption %</label>
                            <input
                              type="number"
                              value={exemptionPercentage}
                              onChange={e => setExemptionPercentage(e.target.value)}
                              placeholder="0-100"
                              className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Capital Gain ($)</label>
                            <input
                              type="number"
                              value={capitalGain}
                              onChange={e => setCapitalGain(e.target.value)}
                              placeholder="0"
                              className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Taxable Gain ($)</label>
                            <input
                              type="number"
                              value={taxableGain}
                              onChange={e => setTaxableGain(e.target.value)}
                              placeholder="0"
                              className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Net Capital Gain ($)</label>
                            <input
                              type="number"
                              value={netCapitalGain}
                              onChange={e => setNetCapitalGain(e.target.value)}
                              placeholder="0"
                              className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">CGT Payable ($)</label>
                            <input
                              type="number"
                              value={cgtPayable}
                              onChange={e => setCgtPayable(e.target.value)}
                              placeholder="0"
                              className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Notes</label>
                          <textarea
                            value={expectedNotes}
                            onChange={e => setExpectedNotes(e.target.value)}
                            placeholder="Notes on expected calculation..."
                            rows={2}
                            className="w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Applicable Rules */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Applicable Tax Rules</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {applicableRules.map(rule => (
                        <span key={rule} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs">
                          <span className="text-indigo-400">§</span>
                          {rule}
                          <button onClick={() => handleRemoveRule(rule)} className="ml-0.5 hover:text-indigo-900 dark:hover:text-indigo-100">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={ruleInput}
                        onChange={e => setRuleInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddRule(); } }}
                        placeholder="e.g. Section 118-145 ITAA 1997..."
                        className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                      />
                      <button onClick={handleAddRule} className="px-3 py-1.5 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <p className="text-xs text-slate-400">
                    {properties.length} propert{properties.length === 1 ? 'y' : 'ies'}, {events.length} events
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!title.trim() || isSaving}
                      className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {isSaving ? 'Saving...' : editingScenarioId ? 'Update Metadata' : 'Save Scenario'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
