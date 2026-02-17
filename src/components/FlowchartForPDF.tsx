'use client';

import React, { useRef, forwardRef } from 'react';
import { format } from 'date-fns';
import { Property, TimelineEvent, useTimelineStore } from '@/store/timeline';
import { formatCurrency } from '@/lib/utils';
import { getDivision43Deductions } from '@/lib/cost-base-calculations';
import { ArrowRight, Home, TrendingUp } from 'lucide-react';
import html2canvas from 'html2canvas';

interface FlowchartForPDFProps {
  properties?: Property[];
  events?: TimelineEvent[];
}

// Standalone component that can be rendered offscreen for capture
const FlowchartForPDF = forwardRef<HTMLDivElement, FlowchartForPDFProps>(
  ({ properties: propProperties, events: propEvents }, ref) => {
    const store = useTimelineStore();
    const properties = propProperties || store.properties;
    const events = propEvents || store.events;

    const getPropertyFlowData = (property: Property) => {
      const propertyEvents = events
        .filter((e) => e.propertyId === property.id)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      const purchaseEvent = propertyEvents.find((e) => e.type === 'purchase');
      const saleEvent = propertyEvents.find((e) => e.type === 'sale');
      const moveInEvent = propertyEvents.find((e) => e.type === 'move_in');
      const moveOutEvent = propertyEvents.find((e) => e.type === 'move_out');
      const rentStartEvent = propertyEvents.find((e) => e.type === 'rent_start');
      const improvementEvents = propertyEvents.filter((e) => e.type === 'improvement');

      const purchasePrice = purchaseEvent?.amount || 0;
      const purchaseCosts = purchaseEvent?.costBases?.reduce((sum, cb) => sum + cb.amount, 0) || 0;
      const improvementCosts = improvementEvents.reduce(
        (sum, e) => sum + (e.amount || 0) + (e.costBases?.reduce((s, cb) => s + cb.amount, 0) || 0),
        0
      );
      const sellingCosts = saleEvent?.costBases?.reduce((sum, cb) => sum + cb.amount, 0) || 0;
      const div43Deductions = getDivision43Deductions(saleEvent);
      const totalCostBase = purchasePrice + purchaseCosts + improvementCosts + sellingCosts - div43Deductions;

      return {
        purchaseEvent,
        saleEvent,
        moveInEvent,
        moveOutEvent,
        rentStartEvent,
        improvementEvents,
        purchasePrice,
        purchaseCosts,
        improvementCosts,
        sellingCosts,
        div43Deductions,
        totalCostBase,
        capitalGain: saleEvent ? (saleEvent.amount || 0) - totalCostBase : 0,
      };
    };

    return (
      <div ref={ref} className="bg-white p-8 space-y-8" style={{ width: '1200px', minHeight: '800px' }}>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Property Timeline Flowchart</h2>
          <p className="text-sm text-gray-600 mt-2">
            Property lifecycle showing acquisition, occupancy, improvements, and disposition
          </p>
        </div>

        {properties.map((property) => {
          const data = getPropertyFlowData(property);
          if (!data.purchaseEvent) return null;

          return (
            <div
              key={property.id}
              className="border-2 border-gray-300 rounded-2xl p-8 shadow-xl"
            >
              {/* Property Title */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg">
                  <Home className="w-6 h-6" />
                  <div>
                    <div className="text-lg font-bold">{property.name}</div>
                    <div className="text-xs opacity-90">{property.address}</div>
                  </div>
                </div>
              </div>

              {/* Flow Diagram */}
              <div className="space-y-6">
                {/* 1. Acquisition Phase */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-32 text-right">
                    <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                      ACQUISITION
                    </div>
                  </div>
                  <ArrowRight className="flex-shrink-0 w-6 h-6 text-gray-400 mt-4" />
                  <div className="flex-1">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-sm font-bold text-green-700 uppercase tracking-wide mb-1">
                            Purchase
                          </div>
                          <div className="text-xs text-gray-600">
                            {format(data.purchaseEvent.date, 'dd MMM yyyy')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Purchase Price</div>
                          <div className="text-xl font-bold text-green-600">
                            {formatCurrency(data.purchasePrice)}
                          </div>
                        </div>
                      </div>
                      {data.purchaseCosts > 0 && (
                        <div className="pt-3 border-t border-green-200">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {data.purchaseEvent.costBases?.map((cb) => (
                              <div key={cb.id} className="flex justify-between">
                                <span className="text-gray-600">{cb.name}:</span>
                                <span className="font-medium text-gray-900">
                                  {formatCurrency(cb.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 pt-2 border-t border-green-200 flex justify-between">
                            <span className="text-sm font-bold text-green-700">
                              Total Acquisition Cost:
                            </span>
                            <span className="text-sm font-bold text-green-600">
                              {formatCurrency(data.purchasePrice + data.purchaseCosts)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Occupancy Phase */}
                {(data.moveInEvent || data.rentStartEvent) && (
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-32 text-right">
                      <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                        OCCUPANCY
                      </div>
                    </div>
                    <ArrowRight className="flex-shrink-0 w-6 h-6 text-gray-400 mt-4" />
                    <div className="flex-1 space-y-3">
                      {data.moveInEvent && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-500 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-1">
                                Main Residence (PPR)
                              </div>
                              <div className="text-xs text-gray-600">
                                {format(data.moveInEvent.date, 'dd MMM yyyy')} -{' '}
                                {data.moveOutEvent
                                  ? format(data.moveOutEvent.date, 'dd MMM yyyy')
                                  : 'Present'}
                              </div>
                            </div>
                            <div className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold">
                              CGT Exempt
                            </div>
                          </div>
                        </div>
                      )}
                      {data.rentStartEvent && (
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-500 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-bold text-purple-700 uppercase tracking-wide mb-1">
                                Rental Property
                              </div>
                              <div className="text-xs text-gray-600">
                                {format(data.rentStartEvent.date, 'dd MMM yyyy')} - Present
                              </div>
                            </div>
                            <div className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold">
                              CGT Applies
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Improvements Phase */}
                {data.improvementEvents.length > 0 && (
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-32 text-right">
                      <div className="inline-block bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-xs font-bold">
                        IMPROVEMENTS
                      </div>
                    </div>
                    <ArrowRight className="flex-shrink-0 w-6 h-6 text-gray-400 mt-4" />
                    <div className="flex-1">
                      <div className="bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-500 rounded-xl p-4">
                        <div className="text-sm font-bold text-pink-700 uppercase tracking-wide mb-3">
                          Capital Improvements ({data.improvementEvents.length})
                        </div>
                        <div className="space-y-2">
                          {data.improvementEvents.map((imp) => (
                            <div
                              key={imp.id}
                              className="bg-white rounded-lg p-3 border border-pink-200"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="text-xs text-gray-600 mb-1">
                                    {format(imp.date, 'dd MMM yyyy')}
                                  </div>
                                  <div className="text-sm text-gray-900">
                                    {imp.description || 'Capital improvement'}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-bold text-pink-600">
                                    {formatCurrency(imp.amount || 0)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-pink-200 flex justify-between">
                          <span className="text-sm font-bold text-pink-700">
                            Total Improvements:
                          </span>
                          <span className="text-sm font-bold text-pink-600">
                            {formatCurrency(data.improvementCosts)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Disposition Phase */}
                {data.saleEvent && (
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-32 text-right">
                      <div className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold">
                        DISPOSITION
                      </div>
                    </div>
                    <ArrowRight className="flex-shrink-0 w-6 h-6 text-gray-400 mt-4" />
                    <div className="flex-1">
                      <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-500 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="text-sm font-bold text-red-700 uppercase tracking-wide mb-1">
                              Sale
                            </div>
                            <div className="text-xs text-gray-600">
                              {format(data.saleEvent.date, 'dd MMM yyyy')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Sale Price</div>
                            <div className="text-xl font-bold text-red-600">
                              {formatCurrency(data.saleEvent.amount || 0)}
                            </div>
                          </div>
                        </div>
                        {data.sellingCosts > 0 && (
                          <div className="pt-3 border-t border-red-200">
                            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                              {data.saleEvent.costBases?.map((cb) => (
                                <div key={cb.id} className="flex justify-between">
                                  <span className="text-gray-600">{cb.name}:</span>
                                  <span className="font-medium text-gray-900">
                                    {formatCurrency(cb.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. CGT Calculation Summary */}
                {data.saleEvent && (
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-32 text-right">
                      <div className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold">
                        CGT RESULT
                      </div>
                    </div>
                    <TrendingUp className="flex-shrink-0 w-6 h-6 text-gray-400 mt-4" />
                    <div className="flex-1">
                      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl p-6 shadow-xl">
                        <div className="grid grid-cols-3 gap-4 text-center mb-4">
                          <div>
                            <div className="text-xs opacity-90 mb-1">Total Cost Base</div>
                            <div className="text-lg font-bold">{formatCurrency(data.totalCostBase)}</div>
                          </div>
                          <div>
                            <div className="text-xs opacity-90 mb-1">Sale Proceeds</div>
                            <div className="text-lg font-bold">
                              {formatCurrency(data.saleEvent.amount || 0)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs opacity-90 mb-1">Capital Gain</div>
                            <div className="text-2xl font-bold">{formatCurrency(data.capitalGain)}</div>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-white/20 text-center">
                          <div className="text-xs opacity-90">
                            Ownership Period: {Math.round((data.saleEvent.date.getTime() - data.purchaseEvent.date.getTime()) / (1000 * 60 * 60 * 24 * 365))} years
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

FlowchartForPDF.displayName = 'FlowchartForPDF';

// Export function to capture flowchart as base64 image
export async function captureFlowchartAsImage(properties?: Property[], events?: TimelineEvent[]): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create a temporary container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    // Create a root to render the component
    import('react-dom/client').then(({ createRoot }) => {
      const root = createRoot(container);

      const captureRef = React.createRef<HTMLDivElement>();

      root.render(
        React.createElement(FlowchartForPDF, {
          ref: captureRef,
          properties,
          events,
        })
      );

      // Wait for render, then capture
      setTimeout(async () => {
        try {
          if (captureRef.current) {
            const canvas = await html2canvas(captureRef.current, {
              backgroundColor: '#ffffff',
              scale: 2,
              logging: false,
              useCORS: true,
              allowTaint: true,
            });

            const base64Image = canvas.toDataURL('image/png');

            // Cleanup
            root.unmount();
            document.body.removeChild(container);

            resolve(base64Image);
          } else {
            reject(new Error('Failed to capture flowchart'));
          }
        } catch (error) {
          // Cleanup on error
          root.unmount();
          document.body.removeChild(container);
          reject(error);
        }
      }, 500); // Give time for rendering
    });
  });
}

export default FlowchartForPDF;
