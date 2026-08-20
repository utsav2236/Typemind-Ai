import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// A simple QWERTY layout
const keyboardRows = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', '\''],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/']
];

// Map finger to keys
const fingerMapping = {
  'Left Pinky': ['Q', 'A', 'Z'],
  'Left Ring': ['W', 'S', 'X'],
  'Left Middle': ['E', 'D', 'C'],
  'Left Index': ['R', 'F', 'V', 'T', 'G', 'B'],
  'Right Index': ['Y', 'H', 'N', 'U', 'J', 'M'],
  'Right Middle': ['I', 'K', ','],
  'Right Ring': ['O', 'L', '.'],
  'Right Pinky': ['P', ';', '/', '[', ']', '\\', '\''],
};

const getFingerForKey = (key) => {
  for (const [finger, keys] of Object.entries(fingerMapping)) {
    if (keys.includes(key)) return finger;
  }
  return 'Unknown';
};

const KeyboardHeatmap = ({ data = [] }) => {
  const [selectedKey, setSelectedKey] = useState(null);

  // Helper to get heat data for a specific key
  const getKeyData = (key) => {
    return data.find(k => k.key === key);
  };

  const getHeatColor = (accuracy) => {
    if (accuracy === undefined) return 'bg-card border-border-color text-text-secondary hover:border-primary/50';
    if (accuracy < 60) return 'bg-error/20 border-error/50 text-error hover:border-error';
    if (accuracy < 80) return 'bg-warning/20 border-warning/50 text-warning hover:border-warning';
    return 'bg-success/20 border-success/50 text-success hover:border-success';
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      {/* Keyboard */}
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface p-6 shadow-sm border border-border-color w-full max-w-4xl overflow-x-auto">
        {keyboardRows.map((row, rowIndex) => (
          <div 
            key={rowIndex} 
            className="flex gap-2"
            style={{ paddingLeft: `${rowIndex * 1.5}rem` }} // Simple stagger effect
          >
            {row.map(key => {
              const keyData = getKeyData(key);
              const isSelected = selectedKey?.key === key;
              
              return (
                <button
                  key={key}
                  onClick={() => setSelectedKey({ key, ...keyData })}
                  className={`
                    relative flex h-12 w-12 items-center justify-center rounded-lg border-2 font-mono text-lg font-medium transition-all
                    ${getHeatColor(keyData?.accuracy)}
                    ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-dark-surface scale-110 z-10 shadow-lg' : ''}
                  `}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Detail View */}
      <div className="h-40 w-full max-w-md">
        <AnimatePresence mode="wait">
          {selectedKey ? (
            <motion.div
              key={selectedKey.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-xl border border-primary/30 bg-primary/5 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-card font-mono text-xl font-bold text-text-main">
                  {selectedKey.key}
                </span>
                <span className="text-sm font-medium text-text-secondary">
                  Finger: <span className="text-text-main">{getFingerForKey(selectedKey.key)}</span>
                </span>
              </div>
              
              {selectedKey.accuracy !== undefined ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-text-secondary">Accuracy</p>
                    <p className={`text-xl font-bold ${selectedKey.accuracy < 80 ? 'text-error' : 'text-success'}`}>
                      {selectedKey.accuracy}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Mistakes</p>
                    <p className="text-xl font-bold text-text-main">{selectedKey.mistakes || 0}</p>
                  </div>
                </div>
              ) : (
                <p className="text-text-secondary py-2">No data recorded for this key yet.</p>
              )}
            </motion.div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border-color bg-surface/50 text-text-secondary">
              Click any key to view detailed performance
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default KeyboardHeatmap;

