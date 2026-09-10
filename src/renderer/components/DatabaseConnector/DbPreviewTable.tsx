import React from 'react'

export interface PreviewRow {
  id: string
  entryDate: string | null
  docNo: string
  docDate: string | null
  description: string
  debitAccount: string
  creditAccount: string
  amount: bigint | string | number
  partnerCode: string
  partnerName: string
  sourceRow: number
}

interface DbPreviewTableProps {
  rows: PreviewRow[]
}

export const DbPreviewTable: React.FC<DbPreviewTableProps> = ({ rows }) => {
  if (rows.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-slate-400">
        Chưa có dữ liệu xem trước. Bấm &quot;Xem trước dữ liệu&quot; để kiểm tra 10 dòng đầu tiên.
      </div>
    )
  }

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden text-xs">
      <div className="max-h-60 overflow-y-auto overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 font-semibold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-2 w-12 text-center">#</th>
              <th className="p-2 whitespace-nowrap">Ngày CT</th>
              <th className="p-2 whitespace-nowrap">Số CT</th>
              <th className="p-2 min-w-[200px]">Diễn giải</th>
              <th className="p-2 text-center">TK Nợ</th>
              <th className="p-2 text-center">TK Có</th>
              <th className="p-2 text-right whitespace-nowrap">Số tiền (VNĐ)</th>
              <th className="p-2">Mã ĐT</th>
              <th className="p-2 min-w-[150px]">Tên đối tượng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((r, idx) => {
              const amtNum = typeof r.amount === 'bigint' ? Number(r.amount) : Number(r.amount || 0)
              return (
                <tr key={r.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                  <td className="p-2 whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {r.entryDate || '-'}
                  </td>
                  <td className="p-2 font-mono font-medium text-blue-600 dark:text-blue-400">
                    {r.docNo || '-'}
                  </td>
                  <td className="p-2 text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[250px]" title={r.description}>
                    {r.description}
                  </td>
                  <td className="p-2 text-center font-mono font-medium text-emerald-600">
                    {r.debitAccount}
                  </td>
                  <td className="p-2 text-center font-mono font-medium text-amber-600">
                    {r.creditAccount}
                  </td>
                  <td className="p-2 text-right font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                    {amtNum.toLocaleString('vi-VN')}
                  </td>
                  <td className="p-2 font-mono text-slate-500">{r.partnerCode || '-'}</td>
                  <td className="p-2 text-slate-600 dark:text-slate-300 truncate max-w-[180px]" title={r.partnerName}>
                    {r.partnerName || '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
