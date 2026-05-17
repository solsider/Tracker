/**
 * Run this script BEFORE running prisma migrate dev.
 * It converts existing Issue.status values to Column records.
 *
 * Steps:
 * 1. Add Column model + nullable columnId to Issue in schema (keep status)
 * 2. Run: npx prisma migrate dev --name add-columns-nullable
 * 3. Run: npx ts-node prisma/migrate-to-columns.ts
 * 4. Remove status from Issue + make columnId required in schema
 * 5. Run: npx prisma migrate dev --name remove-status
 *
 * For a clean dev reset: npx prisma migrate reset
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const STATUS_COLUMNS = [
  { statusKey: 'TODO', title: 'К выполнению', color: '#6b7280', order: 0 },
  { statusKey: 'IN_PROGRESS', title: 'В работе', color: '#3b82f6', order: 1 },
  { statusKey: 'IN_REVIEW', title: 'На проверке', color: '#f59e0b', order: 2 },
  { statusKey: 'DONE', title: 'Готово', color: '#22c55e', order: 3 },
  { statusKey: 'CANCELLED', title: 'Отменено', color: '#ef4444', order: 4 },
];

async function main() {
  const projects = await prisma.project.findMany({
    include: { issues: { select: { id: true, status: true } } } as any,
  });

  for (const project of projects) {
    console.log(`Migrating project: ${project.name}`);

    const columns = await Promise.all(
      STATUS_COLUMNS.map((col) =>
        prisma.column.create({
          data: {
            title: col.title,
            color: col.color,
            order: col.order,
            projectId: project.id,
          },
        }),
      ),
    );

    const statusToColumnId = Object.fromEntries(
      STATUS_COLUMNS.map((col, i) => [col.statusKey, columns[i].id]),
    );

    for (const issue of (project as any).issues) {
      await (prisma as any).issue.update({
        where: { id: issue.id },
        data: { columnId: statusToColumnId[issue.status] ?? columns[0].id },
      });
    }

    console.log(`  → Created ${columns.length} columns, migrated ${(project as any).issues.length} issues`);
  }

  console.log('Migration complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
