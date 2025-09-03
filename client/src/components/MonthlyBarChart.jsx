import React from 'react';
import { Bar } from 'react-chartjs-2';

const MonthlyBarChart = ({ data, title, theme }) => {
  const textColor = theme === 'dark' ? '#cbd5e1' : '#374151';
  const titleColor = theme === 'dark' ? '#f1f5f9' : '#111827';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
  const tickColor = theme === 'dark' ? '#94a3b8' : '#4b5563';

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: textColor } },
      title: { display: true, text: title, color: titleColor, font: { size: 16 } },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(context.raw)}`
        }
      }
    },
    scales: {
      x: { ticks: { color: tickColor }, grid: { color: gridColor } },
      y: {
        ticks: { color: tickColor, callback: (value) => new Intl.NumberFormat('ja-JP', { notation: 'compact' }).format(value) },
        grid: { color: gridColor }
      },
    },
  };
  
  // データが存在する場合のみチャートを描画
  const hasData = data && data.datasets && data.datasets.some(ds => ds.data.length > 0);

  return (
    <div className="h-80">
      {hasData ? <Bar options={options} data={data} /> : <p className="text-center h-full flex items-center justify-center">表示するデータがありません</p>}
    </div>
  );
};

export default MonthlyBarChart;