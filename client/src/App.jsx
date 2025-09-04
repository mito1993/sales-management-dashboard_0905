import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Chart.jsコンポーネントの登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// =================================================================================
// UI Helper Components
// =================================================================================
const Card = ({ children, className = '', title, theme }) => (
    <div className={`rounded-lg shadow-lg p-6 ${className} ${theme === 'dark' ? 'bg-slate-800' : 'bg-white border border-gray-200/80'}`}>
        <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-slate-100' : 'text-gray-900'}`}>{title}</h2>
        {children}
    </div>
);

const FilterSection = ({ title, children, theme }) => (
    <div>
        <h3 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>{title}</h3>
        {children}
    </div>
);

const MultiSelectDropdown = ({ options, selectedOptions, onChange, placeholder = 'すべて', theme }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOptionToggle = (option) => {
        const newSelected = selectedOptions.includes(option) ? selectedOptions.filter(item => item !== option) : [...selectedOptions, option];
        onChange(newSelected);
    };
    
    const displayValue = () => {
        if (selectedOptions.length === 0 || !options || options.length === 0 || selectedOptions.length === options.length) return placeholder;
        if (selectedOptions.length > 2) return `${selectedOptions.length}件選択済み`;
        return selectedOptions.join(', ');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className={`w-full border rounded-md p-2 flex justify-between items-center text-left transition-colors ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500' : 'bg-white border-gray-300 text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'}`}>
                <span className="truncate">{displayValue()}</span>
                <svg className={`w-4 h-4 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && (
                <div className={`absolute z-10 w-full mt-1 border rounded-md shadow-lg max-h-60 overflow-y-auto ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'}`}>
                    <div className={`p-2 flex gap-2 border-b sticky top-0 ${theme === 'dark' ? 'border-slate-600 bg-slate-700' : 'border-gray-200 bg-gray-50'}`}>
                        <button onClick={() => onChange(options)} className={`flex-1 text-xs px-2 py-1 rounded transition-colors ${theme === 'dark' ? 'bg-slate-600 hover:bg-cyan-600 text-slate-200' : 'bg-gray-200 hover:bg-indigo-500 hover:text-white text-gray-700'}`}>すべて選択</button>
                        <button onClick={() => onChange([])} className={`flex-1 text-xs px-2 py-1 rounded transition-colors ${theme === 'dark' ? 'bg-slate-600 hover:bg-rose-600 text-slate-200' : 'bg-gray-200 hover:bg-rose-500 hover:text-white text-gray-700'}`}>すべて解除</button>
                    </div>
                    <ul>
                        {options && options.map(option => (
                            <li key={option} className={`px-3 py-2 cursor-pointer ${theme === 'dark' ? 'hover:bg-slate-600/70' : 'hover:bg-gray-100'}`} onClick={() => handleOptionToggle(option)}>
                                <label className={`flex items-center space-x-3 w-full cursor-pointer ${theme === 'dark' ? 'text-slate-200' : 'text-gray-800'}`}>
                                    <input type="checkbox" checked={selectedOptions.includes(option)} readOnly className={`h-4 w-4 rounded cursor-pointer ${theme === 'dark' ? 'bg-slate-800 border-slate-500 text-cyan-500 focus:ring-cyan-500' : 'bg-gray-100 border-gray-400 text-indigo-600 focus:ring-indigo-500'}`} />
                                    <span>{option}</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const MonthlyBarChart = ({ data, title, theme }) => {
    const textColor = theme === 'dark' ? '#cbd5e1' : '#374151';
    const titleColor = theme === 'dark' ? '#f1f5f9' : '#111827';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
    const tickColor = theme === 'dark' ? '#94a3b8' : '#4b5563';

    const options = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { color: textColor } },
            title: { display: true, text: title, color: titleColor, font: { size: 16 } },
            tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(context.raw)}` } }
        },
        scales: {
            x: { ticks: { color: tickColor }, grid: { color: gridColor } },
            y: { ticks: { color: tickColor, callback: (value) => new Intl.NumberFormat('ja-JP', { notation: 'compact' }).format(value) }, grid: { color: gridColor } },
        },
    };
    return <div className="h-80">{data && data.datasets && data.datasets[0].data.some(v => v > 0) ? <Bar options={options} data={data} /> : <p className="text-center h-full flex items-center justify-center">表示するデータがありません</p>}</div>;
};

const ChannelDoughnutChart = ({ data, theme }) => {
    const textColor = theme === 'dark' ? '#cbd5e1' : '#374151';
    const titleColor = theme === 'dark' ? '#f1f5f9' : '#111827';

    const themedData = useMemo(() => ({
        ...data, datasets: data.datasets.map(dataset => ({ ...dataset, borderColor: theme === 'dark' ? '#1e293b' : '#ffffff' }))
    }), [data, theme]);

    const options = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { position: 'right', labels: { color: textColor } },
            title: { display: true, text: '商流別粗利構成比 (納品ベース)', color: titleColor, font: { size: 16 } },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const label = context.label || ''; const value = context.raw;
                        const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${label}: ${Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(value)} (${percentage}%)`;
                    }
                }
            }
        },
    };
    return <div className="h-80">{data && data.datasets && data.datasets[0].data.length > 0 && data.datasets[0].data.some(v => v > 0) ? <Doughnut data={themedData} options={options} /> : <p className="text-center h-full flex items-center justify-center">表示するデータがありません</p>}</div>;
};

const SortIcon = ({ direction }) => {
    if (direction === 'ascending') return <span className="text-slate-400">▲</span>;
    if (direction === 'descending') return <span className="text-slate-400">▼</span>;
    return <span className="text-slate-600">▲▼</span>;
};

const RepPerformanceTable = ({ data, onSort, sortConfig, theme }) => {
    const headers = [
        { key: 'salesRep', label: '営業担当' }, { key: 'dealCount', label: '案件数' },
        { key: 'totalSales', label: '売上高' }, { key: 'totalProfit', label: '粗利金額' }, { key: 'avgSale', label: '単価' },
    ];

    return (
        <div className="overflow-x-auto">
            <table className={`w-full text-left text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-gray-600'}`}>
                <thead className={`text-xs uppercase ${theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
                    <tr>
                        {headers.map(({ key, label }) => (
                            <th key={key} scope="col" className="px-4 py-3">
                                <button onClick={() => onSort(key)} className={`flex items-center gap-2 ${theme === 'dark' ? 'hover:text-slate-200' : 'hover:text-gray-800'}`}>
                                    {label} <SortIcon direction={sortConfig?.key === key ? sortConfig.direction : null} />
                                </button>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data && data.length > 0 ? data.map((row) => (
                        <tr key={row.salesRep} className={`border-b ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-600/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <td className={`px-4 py-3 font-medium whitespace-nowrap ${theme === 'dark' ? 'text-slate-100' : 'text-gray-900'}`}>{row.salesRep}</td>
                            <td className="px-4 py-3 text-right">{row.dealCount.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right">{row.totalSales.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })}</td>
                            <td className="px-4 py-3 text-right">{row.totalProfit.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })}</td>
                            <td className="px-4 py-3 text-right">{row.avgSale.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })}</td>
                        </tr>
                    )) : (
                        <tr><td colSpan={headers.length} className="text-center py-8">表示するデータがありません</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

// Main App Component
const App = () => {
    const [deals, setDeals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [theme, setTheme] = useState('dark');
    const [selectedFiscalYear, setSelectedFiscalYear] = useState(3); // 最新の期をデフォルトに
    const [selectedSalesReps, setSelectedSalesReps] = useState([]);
    const [selectedChannels, setSelectedChannels] = useState([]);
    // ===== ▼▼▼ 案件フェーズのフィルタを追加 ▼▼▼ =====
    const ALL_PHASES = ['納品完了', '受注済み', '実施確定', '確度高', '確度中', '確度低', '失注'];
    const [selectedPhases, setSelectedPhases] = useState(['納品完了', '受注済み', '実施確定']); // デフォルト
    // ==========================================

    const [sortConfig, setSortConfig] = useState({ key: 'totalSales', direction: 'descending' });

    const parseJapaneseDate = (dateString) => {
        if (!dateString || typeof dateString !== 'string') return null;
        const match = dateString.match(/(\d{4})年(\d{1,2})月/);
        if (match) {
            const year = parseInt(match[1], 10);
            const month = parseInt(match[2], 10) - 1;
            return new Date(year, month, 1);
        }
        return null;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const baseUrl = import.meta.env.VITE_API_BASE_URL;
                const url = new URL('/api/sales-data', baseUrl);
                const serverUrl = url.href;
                console.log("接続先サーバーURL:", serverUrl);

                const response = await axios.get(serverUrl);
                const formattedData = response.data.map(item => ({
                    ...item,
                    orderMonth: parseJapaneseDate(item.orderMonth),
                    deliveryMonth: parseJapaneseDate(item.deliveryMonth),
                }));
                setDeals(formattedData);
            } catch (err) {
                console.error("データ取得エラー:", err);
                setError("データの取得に失敗しました。");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const uniqueSalesReps = useMemo(() => Array.from(new Set(deals.map(d => d.salesRep).filter(Boolean))).sort(), [deals]);
    const uniqueChannels = useMemo(() => Array.from(new Set(deals.map(d => d.channel).filter(Boolean))).sort(), [deals]);

    const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

    // ===== ▼▼▼ データ加工ロジックを修正 ▼▼▼ =====
    const processedData = useMemo(() => {
        const getFiscalYear = (date) => {
            if (!date || isNaN(date.getTime())) return null;
            const year = date.getFullYear();
            const month = date.getMonth(); // 0-11
            const fiscalYearStart = month >= 3 ? year : year - 1;
            return fiscalYearStart - 2022; // 第1期(2023年度)=1, 第2期(2024年度)=2, 第3期(2025年度)=3
        };

        const filteredDeals = deals.filter(deal => {
            // 案件フェーズのフィルタリングを追加
            const phaseMatch = selectedPhases.length === 0 || selectedPhases.includes(deal.phase);
            if (!phaseMatch) return false;
            
            const fiscalYear = getFiscalYear(deal.deliveryMonth || deal.orderMonth);
            const yearMatch = fiscalYear === selectedFiscalYear;
            const repMatch = selectedSalesReps.length === 0 || selectedSalesReps.includes(deal.salesRep);
            const channelMatch = selectedChannels.length === 0 || selectedChannels.includes(deal.channel);
            return yearMatch && repMatch && channelMatch;
        });

        const aggregateMonthlyData = (sourceDeals, dateField) => {
            const MONTH_LABELS = ['4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'];
            const monthlyTotals = new Array(12).fill(0).map(() => ({ sales: 0, profit: 0 }));
            
            sourceDeals.forEach(deal => {
                const date = deal[dateField];
                if (!date) return;
                
                const month = date.getMonth();
                const fiscalMonthIndex = (month - 3 + 12) % 12;
                monthlyTotals[fiscalMonthIndex].sales += deal.sales;
                monthlyTotals[fiscalMonthIndex].profit += deal.profit;
            });

            return {
                labels: MONTH_LABELS,
                datasets: [
                    { label: '売上高', data: monthlyTotals.map(m => m.sales), backgroundColor: 'rgba(59, 130, 246, 0.7)' },
                    { label: '粗利金額', data: monthlyTotals.map(m => m.profit), backgroundColor: 'rgba(22, 163, 74, 0.7)' },
                ],
            };
        };
        
        const orderChartData = aggregateMonthlyData(filteredDeals, 'orderMonth');
        const deliveryChartData = aggregateMonthlyData(filteredDeals, 'deliveryMonth');
        
        const channelDataMap = filteredDeals.reduce((acc, deal) => {
            if(deal.channel) {
                acc[deal.channel] = (acc[deal.channel] || 0) + deal.profit;
            }
            return acc;
        }, {});
        
        const doughnutChartData = {
            labels: Object.keys(channelDataMap),
            datasets: [{ data: Object.values(channelDataMap), backgroundColor: ['#4ade80', '#22d3ee', '#818cf8', '#f87171', '#fbbf24'], borderWidth: 2 }],
        };
        
        const repPerformanceMap = filteredDeals.reduce((acc, deal) => {
            if(deal.salesRep) {
                if (!acc[deal.salesRep]) {
                    acc[deal.salesRep] = { dealCount: 0, totalSales: 0, totalProfit: 0 };
                }
                acc[deal.salesRep].dealCount++;
                acc[deal.salesRep].totalSales += deal.sales;
                acc[deal.salesRep].totalProfit += deal.profit;
            }
            return acc;
        }, {});

        const repPerformanceData = Object.entries(repPerformanceMap).map(([salesRep, data]) => ({
            salesRep, ...data, avgSale: data.dealCount > 0 ? data.totalSales / data.dealCount : 0,
        }));
        
        return { orderChartData, deliveryChartData, doughnutChartData, repPerformanceData };
    }, [deals, selectedFiscalYear, selectedSalesReps, selectedChannels, selectedPhases]);

    const sortedRepPerformanceData = useMemo(() => {
        let sortableItems = [...processedData.repPerformanceData];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const key = sortConfig.key;
                if (a[key] < b[key]) { return sortConfig.direction === 'ascending' ? -1 : 1; }
                if (a[key] > b[key]) { return sortConfig.direction === 'ascending' ? 1 : -1; }
                return 0;
            });
        }
        return sortableItems;
    }, [processedData.repPerformanceData, sortConfig]);

    const handleSort = useCallback((key) => {
        let direction = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    }, [sortConfig]);

    if (isLoading) return <div className="min-h-screen bg-slate-900 flex justify-center items-center text-white">データを読み込み中...</div>;
    if (error) return <div className="min-h-screen bg-slate-900 flex justify-center items-center text-red-500">エラー: {error}</div>;

    return (
        <div className={`min-h-screen p-4 sm:p-6 lg:p-8 transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 text-slate-300' : 'bg-gray-50 text-gray-700'}`}>
            <div className="max-w-7xl mx-auto">
                <header className="mb-6 flex justify-between items-center">
                    <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-gray-900'}`}>営業ダッシュボード</h1>
                    <button onClick={toggleTheme} className={`p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 focus:ring-cyan-500 focus:ring-offset-slate-900' : 'bg-gray-200 text-gray-600 hover:bg-gray-300 focus:ring-indigo-500 focus:ring-offset-gray-50'}`} aria-label="テーマを切り替える">
                        {theme === 'dark' ? ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg> ) : ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm-.707 10.607a1 1 0 011.414-1.414l.707.707a1 1 0 11-1.414 1.414l-.707-.707zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" /></svg> )}
                    </button>
                </header>
                <main className="flex flex-col gap-6">
                    <Card title="フィルタ" theme={theme}>
                        {/* ===== ▼▼▼ grid-cols-4 に変更 ▼▼▼ ===== */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <FilterSection title="期数" theme={theme}>
                                <select value={selectedFiscalYear} onChange={(e) => setSelectedFiscalYear(Number(e.target.value))} className={`w-full border rounded-md p-2 transition-colors ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500' : 'bg-white border-gray-300 text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'}`}>
                                    <option value={1}>第1期 (2023年度)</option>
                                    <option value={2}>第2期 (2024年度)</option>
                                    <option value={3}>第3期 (2025年度)</option>
                                </select>
                            </FilterSection>
                            <FilterSection title="営業担当" theme={theme}>
                                <MultiSelectDropdown options={uniqueSalesReps} selectedOptions={selectedSalesReps} onChange={setSelectedSalesReps} placeholder="すべての担当者" theme={theme}/>
                            </FilterSection>
                            <FilterSection title="商流" theme={theme}>
                                <MultiSelectDropdown options={uniqueChannels} selectedOptions={selectedChannels} onChange={setSelectedChannels} placeholder="すべての商流" theme={theme}/>
                            </FilterSection>
                            {/* ===== ▼▼▼ 案件フェーズのフィルタを追加 ▼▼▼ ===== */}
                            <FilterSection title="案件フェーズ" theme={theme}>
                                <MultiSelectDropdown options={ALL_PHASES} selectedOptions={selectedPhases} onChange={setSelectedPhases} placeholder="すべてのフェーズ" theme={theme}/>
                            </FilterSection>
                            {/* ======================================= */}
                        </div>
                    </Card>
                    <Card title="月別推移" theme={theme}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <MonthlyBarChart data={processedData.orderChartData} title="受注月別推移" theme={theme} />
                            <MonthlyBarChart data={processedData.deliveryChartData} title="納品月別推移" theme={theme} />
                        </div>
                    </Card>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-2">
                            <Card title="構成比" theme={theme}>
                                <ChannelDoughnutChart data={processedData.doughnutChartData} theme={theme} />
                            </Card>
                        </div>
                        <div className="lg:col-span-3">
                            <Card title="担当者別実績 (納品ベース)" theme={theme}>
                                <RepPerformanceTable data={sortedRepPerformanceData} onSort={handleSort} sortConfig={sortConfig} theme={theme} />
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;