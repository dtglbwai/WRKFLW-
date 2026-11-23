import React, { useState } from 'react';
import { Search, Plus, X, PackagePlus } from 'lucide-react';
import { PartItem } from '../types';
import { formatINR } from '../data/workshopSeed';

interface InventoryViewProps {
  parts: PartItem[];
  onRestockPart: (partId: string, addQty: number) => void;
  onAddPart: (part: Omit<PartItem, 'id' | 'lastRestocked'>) => void;
}

export default function InventoryView({
  parts,
  onRestockPart,
  onAddPart,
}: InventoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<
    'All' | 'In Stock' | 'Low Stock' | 'Out of Stock'
  >('All');
  const [showAddModal, setShowAddModal] = useState(false);

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] =
    useState<PartItem['category']>('Engine & Filters');
  const [brand, setBrand] = useState('');
  const [binLocation, setBinLocation] = useState('RACK-A2');
  const [quantity, setQuantity] = useState('10');
  const [reorderLevel, setReorderLevel] = useState('5');
  const [unitCost, setUnitCost] = useState('1200');
  const [sellingPrice, setSellingPrice] = useState('2100');
  const [supplierName, setSupplierName] = useState('TVS Sundaram Parts Depot');
  const [supplierPhone, setSupplierPhone] = useState('+91 44 2811 4520');

  const filteredParts = parts.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.sku.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);

    const status =
      p.quantity === 0
        ? 'Out of Stock'
        : p.quantity <= p.reorderLevel
        ? 'Low Stock'
        : 'In Stock';

    const matchesFilter = stockFilter === 'All' || status === stockFilter;
    return matchesSearch && matchesFilter;
  });

  const totalInventoryValue = parts.reduce(
    (sum, p) => sum + p.quantity * p.unitCost,
    0
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPart({
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      category,
      brand: brand.trim(),
      binLocation: binLocation.trim().toUpperCase(),
      quantity: Math.max(0, Number(quantity) || 0),
      reorderLevel: Math.max(1, Number(reorderLevel) || 4),
      unitCost: Math.max(0, Number(unitCost) || 0),
      sellingPrice: Math.max(0, Number(sellingPrice) || 0),
      supplierName: supplierName.trim(),
      supplierPhone: supplierPhone.trim(),
    });
    setSku('');
    setName('');
    setBrand('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="tb-surface rounded-xl p-4">
          <p className="text-xs font-medium" style={{ color: 'var(--tb-text-muted)' }}>
            Total Tracked SKUs
          </p>
          <p className="text-xl font-display font-bold font-mono mt-1 tabular-nums">
            {parts.length}
          </p>
        </div>
        <div className="tb-surface rounded-xl p-4">
          <p className="text-xs font-medium" style={{ color: 'var(--tb-text-muted)' }}>
            Stock Valuation (Cost)
          </p>
          <p className="text-xl font-display font-bold font-mono mt-1 tabular-nums">
            {formatINR(totalInventoryValue)}
          </p>
        </div>
        <div className="tb-surface rounded-xl p-4">
          <p className="text-xs font-medium" style={{ color: 'var(--tb-text-muted)' }}>
            Reorder Alerts
          </p>
          <p
            className="text-xl font-display font-bold font-mono mt-1 tabular-nums"
            style={{ color: 'var(--tb-accent)' }}
          >
            {parts.filter((p) => p.quantity <= p.reorderLevel).length} items
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--tb-text-muted)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SKU, part name, brand, or bin..."
            className="tb-input w-full h-10 pl-9 pr-3 rounded-lg text-sm"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div
            className="flex items-center gap-1 p-1 rounded-lg"
            style={{ backgroundColor: 'var(--tb-surface-muted)' }}
          >
            {(['All', 'In Stock', 'Low Stock', 'Out of Stock'] as const).map(
              (f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setStockFilter(f)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all"
                  style={
                    stockFilter === f
                      ? {
                          backgroundColor: 'var(--tb-surface-solid)',
                          color: 'var(--tb-text)',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                        }
                      : { color: 'var(--tb-text-muted)' }
                  }
                >
                  {f}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="tb-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" strokeWidth={1.75} />
            Add Spare Part
          </button>
        </div>
      </div>

      <div className="tb-surface rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className="border-b text-xs font-medium"
                style={{
                  borderColor: 'var(--tb-border)',
                  backgroundColor: 'var(--tb-surface-muted)',
                  color: 'var(--tb-text-muted)',
                }}
              >
                <th className="py-3 px-4">SKU / Bin</th>
                <th className="py-3 px-4">Part Description</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4 text-right">Stock</th>
                <th className="py-3 px-4 text-right">Cost / Retail (INR)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Quick Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm" style={{ borderColor: 'var(--tb-border)' }}>
              {filteredParts.map((part) => {
                const isOut = part.quantity === 0;
                const isLow = part.quantity > 0 && part.quantity <= part.reorderLevel;

                return (
                  <tr key={part.id} style={{ borderColor: 'var(--tb-border)' }}>
                    <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                      <div className="font-semibold">{part.sku}</div>
                      <div style={{ color: 'var(--tb-text-muted)' }}>
                        {part.binLocation}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{part.name}</div>
                      <div
                        className="text-xs"
                        style={{ color: 'var(--tb-text-muted)' }}
                      >
                        {part.brand} · {part.category}
                      </div>
                    </td>
                    <td
                      className="py-3 px-4 text-xs"
                      style={{ color: 'var(--tb-text-secondary)' }}
                    >
                      <div>{part.supplierName}</div>
                      <div
                        className="font-mono"
                        style={{ color: 'var(--tb-text-muted)' }}
                      >
                        {part.supplierPhone}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <div className="font-semibold">{part.quantity}</div>
                      <div
                        className="text-[11px]"
                        style={{ color: 'var(--tb-text-muted)' }}
                      >
                        Min {part.reorderLevel}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs tabular-nums whitespace-nowrap">
                      <div style={{ color: 'var(--tb-text-muted)' }}>
                        Cost {formatINR(part.unitCost)}
                      </div>
                      <div className="font-semibold">
                        Retail {formatINR(part.sellingPrice)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium whitespace-nowrap">
                      <span
                        className={
                          isOut
                            ? 'text-red-600 dark:text-red-400'
                            : isLow
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }
                      >
                        {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onRestockPart(part.id, 10)}
                        className="tb-btn-secondary inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium"
                      >
                        <PackagePlus className="w-3.5 h-3.5" strokeWidth={1.75} />
                        +10 Units
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSubmit}
            className="tb-surface-solid rounded-xl w-full max-w-lg p-6 space-y-4"
          >
            <div
              className="flex items-center justify-between pb-3 border-b"
              style={{ borderColor: 'var(--tb-border)' }}
            >
              <h2 className="text-lg font-display font-bold">
                Add Spare Part SKU
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5"
                style={{ color: 'var(--tb-text-muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                required
                placeholder="SKU (e.g. BRK-ROT-320)"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="tb-input h-9 px-3 rounded-lg text-sm font-mono uppercase"
              />
              <input
                required
                placeholder="Bin Location (e.g. RACK-B2)"
                value={binLocation}
                onChange={(e) => setBinLocation(e.target.value)}
                className="tb-input h-9 px-3 rounded-lg text-sm font-mono uppercase"
              />
              <input
                required
                placeholder="Part Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="tb-input col-span-2 h-9 px-3 rounded-lg text-sm"
              />
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as PartItem['category'])
                }
                className="tb-input h-9 px-3 rounded-lg text-sm"
              >
                <option value="Engine & Filters">Engine &amp; Filters</option>
                <option value="Brakes & Suspension">Brakes &amp; Suspension</option>
                <option value="Electrical & Battery">Electrical &amp; Battery</option>
                <option value="Fluids & Lubricants">Fluids &amp; Lubricants</option>
                <option value="Belts & Cooling">Belts &amp; Cooling</option>
                <option value="Tires & Alignment">Tires &amp; Alignment</option>
              </select>
              <input
                required
                placeholder="Brand (e.g. Bosch)"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="tb-input h-9 px-3 rounded-lg text-sm"
              />
              <div>
                <label
                  className="block text-[11px] mb-1"
                  style={{ color: 'var(--tb-text-muted)' }}
                >
                  Initial Qty
                </label>
                <input
                  required
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="tb-input w-full h-9 px-3 rounded-lg text-sm font-mono"
                />
              </div>
              <div>
                <label
                  className="block text-[11px] mb-1"
                  style={{ color: 'var(--tb-text-muted)' }}
                >
                  Reorder Level
                </label>
                <input
                  required
                  type="number"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(e.target.value)}
                  className="tb-input w-full h-9 px-3 rounded-lg text-sm font-mono"
                />
              </div>
              <div>
                <label
                  className="block text-[11px] mb-1"
                  style={{ color: 'var(--tb-text-muted)' }}
                >
                  Unit Cost (₹)
                </label>
                <input
                  required
                  type="number"
                  step="1"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  className="tb-input w-full h-9 px-3 rounded-lg text-sm font-mono"
                />
              </div>
              <div>
                <label
                  className="block text-[11px] mb-1"
                  style={{ color: 'var(--tb-text-muted)' }}
                >
                  Selling Price (₹)
                </label>
                <input
                  required
                  type="number"
                  step="1"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="tb-input w-full h-9 px-3 rounded-lg text-sm font-mono"
                />
              </div>
              <input
                required
                placeholder="Supplier Name"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="tb-input h-9 px-3 rounded-lg text-sm"
              />
              <input
                required
                placeholder="Supplier Phone"
                value={supplierPhone}
                onChange={(e) => setSupplierPhone(e.target.value)}
                className="tb-input h-9 px-3 rounded-lg text-sm font-mono"
              />
            </div>

            <div
              className="flex items-center justify-end gap-2 pt-3 border-t"
              style={{ borderColor: 'var(--tb-border)' }}
            >
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-medium"
                style={{ color: 'var(--tb-text-muted)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="tb-btn-primary px-4 py-2 text-xs font-semibold rounded-lg"
              >
                Save Part SKU
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
