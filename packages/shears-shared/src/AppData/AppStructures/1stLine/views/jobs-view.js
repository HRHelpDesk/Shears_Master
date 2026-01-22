export const JobsList = {
  name: 'JobsList',
  displayName: 'Jobs List',
  component: 'BaseUI/ListView',
  mobileComponent: 'ListView',
  display: 3
};

export const JobsKanban = {
  name: 'JobsKanban',
  displayName: 'Kanban Board',
  component: 'BaseUI/KanbanView',
  mobileComponent: 'KanbanView',
  display: 4,
  // Kanban columns based on job status
  kanbanConfig: {
    groupByField: 'jobStatus',
    columns: [
      { value: 'Pending', label: 'Pending', color: '#F59E0B' },
      { value: 'Assigned', label: 'Assigned', color: '#3B82F6' },
      { value: 'In Transit', label: 'In Transit', color: '#00D4FF' },
      { value: 'Delivered', label: 'Delivered', color: '#10B981' },
      { value: 'Cancelled', label: 'Cancelled', color: '#EF4444' },
    ]
  }
};
