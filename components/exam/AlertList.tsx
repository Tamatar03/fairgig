'use client';

import { Alert, AlertSeverity } from '@/types';

interface AlertListProps {
  alerts: Alert[];
  onDismiss: (index: number) => void;
  onMarkFalsePositive?: (index: number) => void;
  showActions?: boolean;
}

export default function AlertList({ 
  alerts, 
  onDismiss, 
  onMarkFalsePositive,
  showActions = false 
}: AlertListProps) {
  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.HIGH:
        return 'bg-danger-50 border-danger-200 text-danger-800';
      case AlertSeverity.MEDIUM:
        return 'bg-warning-50 border-warning-200 text-warning-800';
      case AlertSeverity.LOW:
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.HIGH:
        return '🚨';
      case AlertSeverity.MEDIUM:
        return '⚠️';
      case AlertSeverity.LOW:
        return 'ℹ️';
      default:
        return '📌';
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Alerts</h3>
        <p className="text-xs text-gray-500">No alerts</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Alerts ({alerts.length})
      </h3>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {alerts.map((alert, index) => (
          <div
            key={index}
            className={`${getSeverityColor(alert.severity)} border rounded-lg p-3 relative`}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">{getSeverityIcon(alert.severity)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{alert.description}</p>
                <p className="text-xs mt-1 opacity-75">
                  Confidence: {Math.round(alert.confidence * 100)}%
                </p>
                {alert.code && (
                  <p className="text-xs mt-1 font-mono opacity-60">
                    {alert.code}
                  </p>
                )}
              </div>
              <button
                onClick={() => onDismiss(index)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Dismiss alert"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {showActions && onMarkFalsePositive && (
              <div className="mt-2 pt-2 border-t border-current/20">
                <button
                  onClick={() => onMarkFalsePositive(index)}
                  className="text-xs underline opacity-75 hover:opacity-100"
                >
                  Mark as false positive
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
