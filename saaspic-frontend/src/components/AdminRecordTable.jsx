export function AdminStatus({ status }) {
  return <span className={`admin-record-status ${String(status).toLowerCase()}`}>{status}</span>;
}

export default function AdminRecordTable({ records, columns, renderActions, renderDetails, label }) {
  return (
    <div className="admin-table-scroll" role="region" aria-label={label} tabIndex={0}>
      <table className="admin-record-table">
        <caption className="admin-table-caption">{label} — {records.length} records</caption>
        <thead><tr>{columns.map((column) => <th scope="col" key={column.label}>{column.label}</th>)}{renderActions && <th scope="col">Actions</th>}{renderDetails && <th scope="col">Details</th>}</tr></thead>
        <tbody>{records.map((record) => (
          <tr key={record._id}>
            {columns.map((column) => <td key={column.label} data-label={column.label}>{column.render(record)}</td>)}
            {renderActions && <td data-label="Actions"><div className="admin-table-actions">{renderActions(record)}</div></td>}
            {renderDetails && <td data-label="Details">{renderDetails(record)}</td>}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
