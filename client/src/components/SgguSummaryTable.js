import React from 'react';

const SgguSummaryTable = ({ summarySggu }) => (
  <div className="absolute left-4 bottom-4 bg-white bg-opacity-90 rounded-lg shadow-lg p-4 max-h-[40vh] overflow-y-auto z-50 min-w-[320px]">
    <div className="font-bold text-lg mb-2">시군구별 병원/약국 개수</div>
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b">
          <th className="text-left py-1 px-2">시군구</th>
          <th className="text-right py-1 px-2">🏥 병원</th>
          <th className="text-right py-1 px-2">💊 약국</th>
        </tr>
      </thead>
      <tbody>
        {summarySggu.map(sggu => (
          <tr key={sggu.sggu} className="border-b last:border-b-0">
            <td className="py-1 px-2">{sggu.sggu}</td>
            <td className="py-1 px-2 text-right text-rose-600 font-semibold">{sggu.hospitalCount}</td>
            <td className="py-1 px-2 text-right text-emerald-600 font-semibold">{sggu.pharmacyCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default SgguSummaryTable; 