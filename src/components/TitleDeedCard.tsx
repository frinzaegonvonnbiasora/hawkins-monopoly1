import React from 'react';
import { Property, Player } from '../types';
import { Shield, Zap, Train, Home, Landmark } from 'lucide-react';

interface TitleDeedCardProps {
  property: Property;
  owner?: Player | null;
}

// ── Themed rent row labels ────────────────────────────────────────────────────
const PROPERTY_RENT_ROWS = [
  { label: 'Influence Cost',    sublabel: '(no barricades)',  icon: <Home size={10} className="text-gray-500" /> },
  { label: '1 Barricade',       sublabel: '',                 icon: <Shield size={10} className="text-green-600" /> },
  { label: '2 Barricades',      sublabel: '',                 icon: <Shield size={10} className="text-green-600" /> },
  { label: '3 Barricades',      sublabel: '',                 icon: <Shield size={10} className="text-green-600" /> },
  { label: '4 Barricades',      sublabel: '',                 icon: <Shield size={10} className="text-green-600" /> },
  { label: 'Hawkins Lab',       sublabel: '(full lockdown)',  icon: <Landmark size={10} className="text-blue-600" /> },
  { label: 'Fortified Base',    sublabel: '(maximum threat)', icon: <Zap size={10} className="text-red-500" /> },
];

const RAILROAD_RENT_ROWS = [
  { label: '1 Station owned',  sublabel: '', icon: <Train size={10} className="text-gray-500" /> },
  { label: '2 Stations owned', sublabel: '', icon: <Train size={10} className="text-gray-500" /> },
  { label: '3 Stations owned', sublabel: '', icon: <Train size={10} className="text-gray-500" /> },
  { label: '4 Stations owned', sublabel: '', icon: <Train size={10} className="text-gray-500" /> },
];

const UTILITY_RENT_ROWS = [
  { label: '1 Utility owned',  sublabel: 'Dice × 4',  icon: <Zap size={10} className="text-yellow-500" /> },
  { label: '2 Utilities owned', sublabel: 'Dice × 10', icon: <Zap size={10} className="text-yellow-500" /> },
];

export const TitleDeedCard: React.FC<TitleDeedCardProps> = ({ property, owner }) => {
  const isRailroad = property.type === 'RAILROAD';
  const isUtility  = property.type === 'UTILITY';
  const isProperty = property.type === 'PROPERTY';

  const rows = isRailroad
    ? RAILROAD_RENT_ROWS.slice(0, property.rent.length)
    : isUtility
    ? UTILITY_RENT_ROWS.slice(0, property.rent.length)
    : PROPERTY_RENT_ROWS.slice(0, property.rent.length);

  return (
    <div className="w-60 bg-[#fafafa] border-[3px] border-[#1a1a1a] shadow-2xl overflow-hidden font-newsreader">

      {/* Color group header */}
      {property.color ? (
        <div
          className="h-10 w-full flex items-center justify-center border-b-[3px] border-[#1a1a1a]"
          style={{ backgroundColor: property.color }}
        >
          <div className="bg-white/90 px-2 py-0.5 border border-[#1a1a1a] shadow-sm max-w-[85%]">
            <h2 className="text-[10px] font-black uppercase text-gray-900 tracking-tight leading-none text-center">
              {property.name}
            </h2>
          </div>
        </div>
      ) : (
        <div className={`text-center py-3 border-b-[3px] border-[#1a1a1a] ${
          isRailroad ? 'bg-slate-800' : isUtility ? 'bg-yellow-800' : 'bg-gray-800'
        }`}>
          <div className="flex items-center justify-center gap-2 mb-0.5">
            {isRailroad ? <Train size={14} className="text-white" /> : <Zap size={14} className="text-yellow-300" />}
            <h2 className="text-xs font-black uppercase text-white tracking-tight italic">
              {property.name}
            </h2>
          </div>
          <p className="text-[8px] font-space-grotesk text-white/50 uppercase tracking-widest">
            {isRailroad ? 'Fast Travel Network' : 'Psychic Signal System'}
          </p>
        </div>
      )}

      {/* Body */}
      <div className="p-3 bg-white">
        {/* Deed label */}
        <div className="mb-3 text-center border-b border-gray-100 pb-2">
          <p className="text-[9px] font-space-grotesk uppercase tracking-[0.25em] text-gray-400 font-bold">
            {isRailroad ? 'Network Control Deed' : isUtility ? 'Energy System Deed' : 'Location Deed'}
          </p>
        </div>

        {/* Monopoly bonus note for properties */}
        {isProperty && (
          <p className="text-[8px] font-space-grotesk text-center text-gray-400 italic mb-2 leading-tight">
            If you own ALL locations in this group,<br />double the influence cost (no barricades).
          </p>
        )}

        {/* Utility special rule */}
        {isUtility && (
          <p className="text-[8px] font-space-grotesk text-center text-gray-400 italic mb-2 leading-tight">
            Rent = dice roll multiplied by the factor shown.<br />
            Owning both doubles the multiplier.
          </p>
        )}

        {/* Rent table */}
        <table className="w-full text-xs mb-1">
          <tbody>
            {rows.map((row, i) => {
              const rentVal = property.rent[i] ?? 0;
              const isCurrent = i === (isProperty ? property.sheds : 0);
              return (
                <tr
                  key={i}
                  className={`border-b border-gray-100 last:border-0 ${
                    isCurrent && isProperty ? 'bg-primary/8 font-black' : ''
                  }`}
                >
                  <td className="py-1.5 text-left">
                    <div className="flex items-center gap-1">
                      {row.icon}
                      <div>
                        <span className="font-space-grotesk text-[9px] uppercase tracking-wide text-gray-700">
                          {row.label}
                        </span>
                        {row.sublabel && (
                          <span className="font-space-grotesk text-[7px] text-gray-400 ml-1 italic">
                            {row.sublabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-1.5 text-right font-black text-gray-900 text-sm">
                    {isUtility ? `× ${i === 0 ? 4 : 10}` : `$${rentVal}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Purchase / upgrade costs */}
        <div className="mt-2 pt-2 border-t-2 border-dashed border-gray-200 space-y-1">
          <div className="flex justify-between font-space-grotesk text-[9px] uppercase tracking-tight">
            <span className="text-gray-500 font-bold">Secure Location</span>
            <span className="text-gray-900 font-black">${property.price}</span>
          </div>
          {property.shedCost && (
            <div className="flex justify-between font-space-grotesk text-[9px] uppercase tracking-tight">
              <span className="text-gray-500">Barricade Cost</span>
              <span className="text-gray-700 font-bold">${property.shedCost} each</span>
            </div>
          )}
          {property.labCost && (
            <div className="flex justify-between font-space-grotesk text-[9px] uppercase tracking-tight">
              <span className="text-gray-500">Lab Upgrade</span>
              <span className="text-gray-700 font-bold">${property.labCost}</span>
            </div>
          )}
          <div className="flex justify-between font-space-grotesk text-[9px] uppercase tracking-tight">
            <span className="text-gray-500">Mortgage Value</span>
            <span className="text-gray-700 font-bold">${property.mortgageValue}</span>
          </div>
        </div>

        {/* Owner badge */}
        {owner && (
          <div className="mt-3 p-2 bg-gray-900 text-white text-center">
            <p className="text-[8px] font-space-grotesk uppercase tracking-widest opacity-50 mb-0.5">Controlled By</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 rounded-full border border-white/30" style={{ backgroundColor: owner.color }} />
              <p className="font-bold text-xs uppercase tracking-tight">{owner.name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom accent */}
      <div className="h-1 w-full" style={{ backgroundColor: property.color || '#1a1a1a' }} />
    </div>
  );
};