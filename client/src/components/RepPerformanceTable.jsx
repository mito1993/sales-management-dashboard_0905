import React from 'react';

const SortIcon = ({ direction }) => {
  if (direction === 'ascending') return <span className="text-slate-400">▲</span>;
  if (direction === 'descending') return <span className="text-slate-400">▼</span>;
  return <span className="text-slate-600">▲▼</span>;
};

const RepPerformanceTable = ({ data, onSort, sortConfig, theme }) => {
  const headers = [
    { key: 'salesRep', label: '営業担当' },
    { key: 'dealCount', label: '案件数' },
    { key: 'totalSales', label: '売上高' },
    { key: 'totalProfit', label: '粗利金額' },
    { key: 'avgSale', label: '単価' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-left text-sm ${ theme === 'dark' ? 'text-slate-300' : 'text-gray-600' }`}>
        <thead className={`text-xs uppercase ${ theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-500' }`}>
          <tr>
            {headers.map(({ key, label }) => (
              <th key={key} scope="col" className="px-4 py-3">
                <button onClick={() => onSort(key)} className={`flex items-center gap-2 ${ theme === 'dark' ? 'hover:text-slate-200' : 'hover:text-gray-800' }`}>
                  {label}
                  <SortIcon direction={sortConfig?.key === key ? sortConfig.direction : null} />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data && data.length > 0 ? (
            data.map((row) => (
              <tr key={row.salesRep} className={`border-b ${ theme === 'dark' ? 'border-slate-700 hover:bg-slate-600/50' : 'border-gray-200 hover:bg-gray-50' }`}>
                <td className={`px-4 py-3 font-medium whitespace-nowrap ${ theme === 'dark' ? 'text-slate-100' : 'text-gray-900' }`}>{row.salesRep}</td>
                <td className="px-4 py-3 text-right">{row.dealCount.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">{row.totalSales.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })}</td>
                <td className="px-4 py-3 text-right">{row.totalProfit.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })}</td>
                <td className="px-4 py-3 text-right">{row.avgSale.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length} className="text-center py-8">表示するデータがありません</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RepPerformanceTable;