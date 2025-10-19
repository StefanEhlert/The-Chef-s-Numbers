import React from 'react';

interface Column {
  key: string;
  label: string;
  render?: (value: any, item: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  colors: any;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
}

const DataTable: React.FC<DataTableProps> = React.memo(({ 
  columns, 
  data, 
  colors, 
  emptyMessage = "Keine Daten vorhanden.",
  emptyAction 
}) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-5">
        <p style={{ color: colors.text }}>{emptyMessage}</p>
        {emptyAction && (
          <div className="mt-3">
            {emptyAction}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra w-full" style={{ color: colors.text }}>
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item.id || index}>
              {columns.map(column => (
                <td key={column.key}>
                  {column.render 
                    ? column.render(item[column.key], item)
                    : item[column.key]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default DataTable; 