import { PrismaClient, SystemRole, ProjectRole, IssuePriority, IssueType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Users ─────────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin1234!', 10);
  const devPassword = await bcrypt.hash('Dev1234!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@tracker.dev' },
    update: {},
    create: {
      email: 'admin@tracker.dev',
      password: adminPassword,
      name: 'Admin',
      systemRole: SystemRole.SYSTEM_ADMIN,
      position: 'System Administrator',
      department: 'Engineering',
    },
  });

  const developer = await prisma.user.upsert({
    where: { email: 'dev@tracker.dev' },
    update: {},
    create: {
      email: 'dev@tracker.dev',
      password: devPassword,
      name: 'Dev User',
      systemRole: SystemRole.DEVELOPER,
      position: 'Full-Stack Developer',
      department: 'Engineering',
    },
  });

  console.log(`  ✓ Users: ${admin.email}, ${developer.email}`);

  // ── Project ───────────────────────────────────────────────────────────────
  const project = await prisma.project.upsert({
    where: { key: 'DEMO' },
    update: {},
    create: {
      name: 'Tracker Demo',
      description: 'A sample project to explore the Tracker app. Feel free to create issues, move them around, and try all features.',
      key: 'DEMO',
      ownerId: admin.id,
    },
  });

  // Add developer as project member
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: developer.id } },
    update: {},
    create: {
      projectId: project.id,
      userId: developer.id,
      role: ProjectRole.MEMBER,
    },
  });

  console.log(`  ✓ Project: ${project.name} (${project.key})`);

  // ── Columns ───────────────────────────────────────────────────────────────
  const columnDefs = [
    { title: 'To Do',       color: '#6366f1', order: 0 },
    { title: 'In Progress', color: '#f59e0b', order: 1 },
    { title: 'In Review',   color: '#8b5cf6', order: 2 },
    { title: 'Done',        color: '#10b981', order: 3 },
  ];

  // Only create columns if none exist for this project
  const existingColumns = await prisma.column.findMany({ where: { projectId: project.id } });
  let columns = existingColumns;
  if (existingColumns.length === 0) {
    columns = await Promise.all(
      columnDefs.map((col) =>
        prisma.column.create({ data: { ...col, projectId: project.id } }),
      ),
    );
  }

  const colMap: Record<string, string> = {};
  columns.forEach((col) => { colMap[col.title] = col.id; });
  const todoId       = colMap['To Do']       || columns[0].id;
  const inProgressId = colMap['In Progress'] || columns[1]?.id || columns[0].id;
  const doneId       = colMap['Done']        || columns[columns.length - 1].id;

  console.log(`  ✓ Columns: ${columns.map((c) => c.title).join(', ')}`);

  // ── Issues ────────────────────────────────────────────────────────────────
  const existingIssueCount = await prisma.issue.count({ where: { projectId: project.id } });
  if (existingIssueCount === 0) {
    const issueDefs = [
      {
        number: 1,
        title: 'Set up project repository and CI pipeline',
        description: '<p>Initialize the Git repository, configure GitHub Actions for CI, and set up branch protection rules.</p>',
        type: IssueType.TASK,
        priority: IssuePriority.HIGH,
        columnId: doneId,
        order: 1,
        storyPoints: 3,
      },
      {
        number: 2,
        title: 'Design database schema',
        description: '<p>Create the initial Prisma schema covering Users, Projects, Issues, and Columns.</p>',
        type: IssueType.TASK,
        priority: IssuePriority.HIGH,
        columnId: doneId,
        order: 2,
        storyPoints: 5,
      },
      {
        number: 3,
        title: 'Implement authentication (JWT + cookies)',
        description: '<p>httpOnly cookie-based auth with access + refresh token rotation. Silent refresh via axios interceptor.</p>',
        type: IssueType.STORY,
        priority: IssuePriority.CRITICAL,
        columnId: inProgressId,
        order: 1,
        storyPoints: 8,
        assigneeId: developer.id,
      },
      {
        number: 4,
        title: 'Build Kanban board with drag-and-drop',
        description: '<p>Implement the Kanban board view using @dnd-kit. Support column reorder and issue move across columns.</p>',
        type: IssueType.STORY,
        priority: IssuePriority.HIGH,
        columnId: inProgressId,
        order: 2,
        storyPoints: 13,
        assigneeId: developer.id,
      },
      {
        number: 5,
        title: 'Fix: issue order not preserved after page reload',
        description: '<p>After dragging issues to reorder them, the order resets on next page load. The backend is not persisting the <code>order</code> field correctly.</p>',
        type: IssueType.BUG,
        priority: IssuePriority.HIGH,
        columnId: todoId,
        order: 1,
        storyPoints: 2,
      },
      {
        number: 6,
        title: 'Add real-time collaboration via WebSocket',
        description: '<p>Implement Socket.io gateway for live board updates, typing indicators, and user presence.</p>',
        type: IssueType.EPIC,
        priority: IssuePriority.MEDIUM,
        columnId: todoId,
        order: 2,
        storyPoints: 21,
      },
      {
        number: 7,
        title: 'Mobile responsive layout',
        description: '<p>Make the sidebar, Kanban board, and issue drawer work correctly on mobile devices.</p>',
        type: IssueType.TASK,
        priority: IssuePriority.MEDIUM,
        columnId: todoId,
        order: 3,
        storyPoints: 5,
      },
    ];

    await Promise.all(
      issueDefs.map((issue) =>
        prisma.issue.create({
          data: {
            ...issue,
            projectId: project.id,
            reporterId: admin.id,
          },
        }),
      ),
    );

    console.log(`  ✓ Issues: ${issueDefs.length} demo issues created`);
  } else {
    console.log(`  ✓ Issues: skipped (${existingIssueCount} already exist)`);
  }

  console.log('\n✅ Seed complete!');
  console.log('\n  Demo credentials:');
  console.log('  ┌─────────────────────────────────────────┐');
  console.log('  │  Admin:  admin@tracker.dev / Admin1234! │');
  console.log('  │  Dev:    dev@tracker.dev  / Dev1234!    │');
  console.log('  └─────────────────────────────────────────┘\n');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
