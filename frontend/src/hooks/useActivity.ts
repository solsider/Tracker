import { useQuery } from '@tanstack/react-query';
import { activityApi } from '../api/activity.api';

export function useIssueActivity(issueId: string, limit?: number) {
  return useQuery({
    queryKey: ['activity', 'issue', issueId, limit],
    queryFn: () => activityApi.getByIssue(issueId, limit),
    enabled: !!issueId,
  });
}

export function useProjectActivity(projectId: string, limit?: number) {
  return useQuery({
    queryKey: ['activity', 'project', projectId, limit],
    queryFn: () => activityApi.getByProject(projectId, limit),
    enabled: !!projectId,
  });
}
