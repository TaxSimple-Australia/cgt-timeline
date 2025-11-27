'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { TimelineEvent, CostBaseItem } from '@/store/timeline';

interface CostBaseSummaryPDFProps {
  event: TimelineEvent;
  propertyAddress: string;
}

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },

  // Header
  header: {
    marginBottom: 25,
    borderBottomWidth: 3,
    borderBottomStyle: 'solid',
    borderBottomColor: '#2563eb',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 10,
  },
  headerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerLabel: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 3,
  },
  headerValue: {
    fontSize: 11,
    color: '#1e293b',
    fontWeight: 'bold',
    marginBottom: 8,
  },

  // Sale Information Box
  saleBox: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#93c5fd',
    borderRadius: 6,
    padding: 15,
    marginBottom: 20,
  },
  saleBoxContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saleLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  saleAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    fontFamily: 'Courier',
  },

  // Section Headers
  sectionHeader: {
    backgroundColor: '#f3f4f6',
    borderLeftWidth: 4,
    borderLeftStyle: 'solid',
    borderLeftColor: '#2563eb',
    padding: 10,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
  },

  // Cost Items Table
  table: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#e5e7eb',
    padding: 12,
  },
  tableRowEven: {
    backgroundColor: '#f9fafb',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCellLeft: {
    flex: 1,
    fontSize: 10,
    color: '#374151',
    fontWeight: 'medium',
  },
  tableCellRight: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'right',
    fontFamily: 'Courier',
    marginLeft: 20,
  },

  // Total Section
  totalSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: '#d1d5db',
    borderRadius: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    fontFamily: 'Courier',
  },

  // Net Proceeds Box
  netProceedsBox: {
    backgroundColor: '#dcfce7',
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: '#86efac',
    borderRadius: 6,
    padding: 15,
    marginTop: 20,
  },
  netProceedsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netProceedsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#166534',
  },
  netProceedsAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#15803d',
    fontFamily: 'Courier',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 2,
    borderTopStyle: 'solid',
    borderTopColor: '#e5e7eb',
    paddingTop: 15,
  },
  footerText: {
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 3,
  },

  // Empty State
  emptyState: {
    padding: 20,
    textAlign: 'center',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});

export function CostBaseSummaryPDF({ event, propertyAddress }: CostBaseSummaryPDFProps) {
  const costBases = event.costBases || [];
  const total = costBases.reduce((sum, item) => sum + item.amount, 0);

  const isPurchase = event.type === 'purchase';
  const isSale = event.type === 'sale';
  const isImprovement = event.type === 'improvement';

  const title = isPurchase ? 'Purchase Cost Base Summary'
    : isSale ? 'Sale Proceeds Summary'
    : 'Improvement Costs Summary';

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-AU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.headerGrid}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerLabel}>Property</Text>
              <Text style={styles.headerValue}>{propertyAddress}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerLabel}>Event Date</Text>
              <Text style={styles.headerValue}>{formatDate(event.date)}</Text>
            </View>
          </View>
          <View style={styles.headerGrid}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerLabel}>Report Generated</Text>
              <Text style={styles.headerValue}>{formatDate(new Date())}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerLabel}>Time</Text>
              <Text style={styles.headerValue}>
                {new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        </View>

        {/* Sale Information (for sale events) */}
        {isSale && event.amount && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>Sale Information</Text>
            </View>
            <View style={styles.saleBox}>
              <View style={styles.saleBoxContent}>
                <Text style={styles.saleLabel}>Gross Sale Proceeds</Text>
                <Text style={styles.saleAmount}>{formatCurrency(event.amount)}</Text>
              </View>
            </View>
          </>
        )}

        {/* Cost Items Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>
            {isPurchase ? 'Cost Base Items' : isSale ? 'Selling Costs' : 'Improvement Costs'}
          </Text>
        </View>

        {/* Cost Items Table */}
        {costBases.length > 0 ? (
          <View style={styles.table}>
            {costBases.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.tableRow,
                  index % 2 === 1 && styles.tableRowEven,
                  index === costBases.length - 1 && styles.tableRowLast,
                ]}
              >
                <Text style={styles.tableCellLeft}>{item.name}</Text>
                <Text style={styles.tableCellRight}>{formatCurrency(item.amount)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyState}>No cost items recorded</Text>
        )}

        {/* Total Section */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Total {isPurchase ? 'Cost Base' : isSale ? 'Selling Costs' : 'Improvements'}:
            </Text>
            <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Net Proceeds (for sale events) */}
        {isSale && event.amount && (
          <View style={styles.netProceedsBox}>
            <View style={styles.netProceedsContent}>
              <Text style={styles.netProceedsLabel}>Net Sale Proceeds</Text>
              <Text style={styles.netProceedsAmount}>{formatCurrency(event.amount - total)}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>CGT Timeline Analysis - Cost Base Summary Report</Text>
          <Text style={styles.footerText}>
            {costBases.length} item{costBases.length !== 1 ? 's' : ''} • Generated on {formatDateTime(new Date())}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
