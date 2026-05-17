import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../socket/socket';
import { useRealtimeStore } from '../store/realtime.store';

export function useProjectRealtime(projectId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!projectId) return;

    const socket = getSocket();
    socket.emit('join-project', { projectId });

    const invalidateIssues = () => qc.invalidateQueries({ queryKey: ['issues', projectId] });
    const invalidateSprints = () => qc.invalidateQueries({ queryKey: ['sprints', projectId] });

    socket.on('issue:created', invalidateIssues);
    socket.on('issue:updated', invalidateIssues);
    socket.on('issue:deleted', invalidateIssues);
    socket.on('issue:moved', invalidateIssues);
    socket.on('sprint:created', invalidateSprints);
    socket.on('sprint:updated', invalidateSprints);
    socket.on('sprint:deleted', invalidateSprints);

    return () => {
      socket.emit('leave-project', { projectId });
      socket.off('issue:created', invalidateIssues);
      socket.off('issue:updated', invalidateIssues);
      socket.off('issue:deleted', invalidateIssues);
      socket.off('issue:moved', invalidateIssues);
      socket.off('sprint:created', invalidateSprints);
      socket.off('sprint:updated', invalidateSprints);
      socket.off('sprint:deleted', invalidateSprints);
    };
  }, [projectId, qc]);
}

export function useIssueRealtime(projectId: string | undefined, issueId: string | undefined, issueNumber: number | undefined) {
  const qc = useQueryClient();
  const { setIssuePresence, setTyping } = useRealtimeStore();

  useEffect(() => {
    if (!issueId || !projectId || !issueNumber) return;

    const socket = getSocket();
    socket.emit('join-issue', { issueId });

    const invalidateIssue = () => {
      qc.invalidateQueries({ queryKey: ['issues', projectId, issueNumber] });
      qc.invalidateQueries({ queryKey: ['issues', projectId] });
    };

    const invalidateComments = () =>
      qc.invalidateQueries({ queryKey: ['comments', projectId, issueNumber] });

    const invalidateAttachments = () =>
      qc.invalidateQueries({ queryKey: ['attachments', projectId, issueNumber] });

    const onPresence = (data: { issueId: string; viewers: { userId: string; name: string }[] }) => {
      setIssuePresence(data.issueId, data.viewers);
    };

    const onTyping = (data: { issueId: string; userId: string; userName: string; isTyping: boolean }) => {
      setTyping(data.issueId, data.userId, data.userName, data.isTyping);
    };

    socket.on('issue:updated', invalidateIssue);
    socket.on('comment:created', invalidateComments);
    socket.on('comment:updated', invalidateComments);
    socket.on('comment:deleted', invalidateComments);
    socket.on('attachment:added', invalidateAttachments);
    socket.on('attachment:deleted', invalidateAttachments);
    socket.on('presence:update', onPresence);
    socket.on('typing:update', onTyping);

    return () => {
      socket.emit('leave-issue', { issueId });
      socket.off('issue:updated', invalidateIssue);
      socket.off('comment:created', invalidateComments);
      socket.off('comment:updated', invalidateComments);
      socket.off('comment:deleted', invalidateComments);
      socket.off('attachment:added', invalidateAttachments);
      socket.off('attachment:deleted', invalidateAttachments);
      socket.off('presence:update', onPresence);
      socket.off('typing:update', onTyping);
    };
  }, [issueId, projectId, issueNumber, qc, setIssuePresence, setTyping]);
}
