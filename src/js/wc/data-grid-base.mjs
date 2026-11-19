// Base utilities for data-grid components
// Provides shared sorting, filtering, selection logic.

export const gridBase = {
  sortData(data, column, direction = 'asc') {
    // Simple sort stub – replace with real implementation.
    return data.sort((a, b) => {
      if (a[column] < b[column]) return direction === 'asc' ? -1 : 1;
      if (a[column] > b[column]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  },
  filterData(data, predicate) {
    return data.filter(predicate);
  },
  selectRows(selectedIds, rowId) {
    const set = new Set(selectedIds);
    if (set.has(rowId)) set.delete(rowId);
    else set.add(rowId);
    return Array.from(set);
  },
};
