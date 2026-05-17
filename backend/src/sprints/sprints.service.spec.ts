import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SprintStatus } from '@prisma/client';
import { SprintsService } from './sprints.service';
import { SprintsRepository } from './sprints.repository';
import { ProjectsRepository } from '../projects/projects.repository';

const PROJECT_ID = 'proj-1';
const USER_ID = 'user-1';
const SPRINT_ID = 'sprint-1';

function makeSprint(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: SPRINT_ID,
    name: 'Sprint 1',
    goal: null,
    status: SprintStatus.PLANNING,
    startDate: null,
    endDate: null,
    completedAt: null,
    capacity: null,
    velocity: null,
    projectId: PROJECT_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { issues: 0 },
    ...overrides,
  };
}

describe('SprintsService', () => {
  let service: SprintsService;
  let sprintsRepo: jest.Mocked<SprintsRepository>;
  let projectsRepo: jest.Mocked<ProjectsRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SprintsService,
        {
          provide: SprintsRepository,
          useValue: {
            findByProject: jest.fn(),
            findById: jest.fn(),
            findActive: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            getBacklog: jest.fn(),
          },
        },
        {
          provide: ProjectsRepository,
          useValue: { isMember: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(SprintsService);
    sprintsRepo = module.get(SprintsRepository);
    projectsRepo = module.get(ProjectsRepository);

    // Default: user is a member
    projectsRepo.isMember.mockResolvedValue(true);
  });

  // ── listSprints ─────────────────────────────────────────────────────────────

  describe('listSprints', () => {
    it('returns sprints for member', async () => {
      const sprints = [makeSprint()];
      sprintsRepo.findByProject.mockResolvedValue(sprints as any);

      const result = await service.listSprints(PROJECT_ID, USER_ID);

      expect(result).toEqual(sprints);
      expect(sprintsRepo.findByProject).toHaveBeenCalledWith(PROJECT_ID);
    });

    it('throws ForbiddenException for non-member', async () => {
      projectsRepo.isMember.mockResolvedValue(false);

      await expect(service.listSprints(PROJECT_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ── createSprint ────────────────────────────────────────────────────────────

  describe('createSprint', () => {
    it('creates sprint with given data', async () => {
      const sprint = makeSprint({ name: 'My Sprint' });
      sprintsRepo.create.mockResolvedValue(sprint as any);

      const result = await service.createSprint(
        PROJECT_ID,
        { name: 'My Sprint' },
        USER_ID,
      );

      expect(result.name).toBe('My Sprint');
      expect(sprintsRepo.create).toHaveBeenCalledWith(
        PROJECT_ID,
        expect.objectContaining({ name: 'My Sprint' }),
      );
    });

    it('parses ISO date strings to Date objects', async () => {
      const sprint = makeSprint();
      sprintsRepo.create.mockResolvedValue(sprint as any);

      await service.createSprint(
        PROJECT_ID,
        { name: 'S', startDate: '2025-01-01', endDate: '2025-01-14' },
        USER_ID,
      );

      const [, createData] = sprintsRepo.create.mock.calls[0];
      expect(createData.startDate).toBeInstanceOf(Date);
      expect(createData.endDate).toBeInstanceOf(Date);
    });

    it('throws ForbiddenException for non-member', async () => {
      projectsRepo.isMember.mockResolvedValue(false);

      await expect(
        service.createSprint(PROJECT_ID, { name: 'S' }, USER_ID),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── startSprint ─────────────────────────────────────────────────────────────

  describe('startSprint', () => {
    it('transitions PLANNING sprint to ACTIVE', async () => {
      sprintsRepo.findById.mockResolvedValue(makeSprint() as any);
      sprintsRepo.findActive.mockResolvedValue(null);
      const active = makeSprint({ status: SprintStatus.ACTIVE });
      sprintsRepo.update.mockResolvedValue(active as any);

      const result = await service.startSprint(SPRINT_ID, USER_ID);

      expect(sprintsRepo.update).toHaveBeenCalledWith(
        SPRINT_ID,
        expect.objectContaining({ status: SprintStatus.ACTIVE }),
      );
      expect(result.status).toBe(SprintStatus.ACTIVE);
    });

    it('throws BadRequestException when sprint is not PLANNING', async () => {
      sprintsRepo.findById.mockResolvedValue(
        makeSprint({ status: SprintStatus.ACTIVE }) as any,
      );

      await expect(service.startSprint(SPRINT_ID, USER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when another sprint is already active', async () => {
      sprintsRepo.findById.mockResolvedValue(makeSprint() as any);
      sprintsRepo.findActive.mockResolvedValue(
        makeSprint({ id: 'other-sprint', status: SprintStatus.ACTIVE }) as any,
      );

      await expect(service.startSprint(SPRINT_ID, USER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when sprint does not exist', async () => {
      sprintsRepo.findById.mockResolvedValue(null);

      await expect(service.startSprint('ghost', USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException for non-member', async () => {
      sprintsRepo.findById.mockResolvedValue(makeSprint() as any);
      projectsRepo.isMember.mockResolvedValue(false);

      await expect(service.startSprint(SPRINT_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ── completeSprint ──────────────────────────────────────────────────────────

  describe('completeSprint', () => {
    it('transitions ACTIVE sprint to COMPLETED', async () => {
      sprintsRepo.findById.mockResolvedValue(
        makeSprint({ status: SprintStatus.ACTIVE }) as any,
      );
      const completed = makeSprint({ status: SprintStatus.COMPLETED, completedAt: new Date() });
      sprintsRepo.update.mockResolvedValue(completed as any);

      const result = await service.completeSprint(SPRINT_ID, USER_ID);

      expect(sprintsRepo.update).toHaveBeenCalledWith(
        SPRINT_ID,
        expect.objectContaining({
          status: SprintStatus.COMPLETED,
          completedAt: expect.any(Date),
        }),
      );
      expect(result.status).toBe(SprintStatus.COMPLETED);
    });

    it('throws BadRequestException when sprint is not ACTIVE', async () => {
      sprintsRepo.findById.mockResolvedValue(makeSprint() as any);

      await expect(service.completeSprint(SPRINT_ID, USER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when sprint not found', async () => {
      sprintsRepo.findById.mockResolvedValue(null);

      await expect(service.completeSprint('ghost', USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── deleteSprint ────────────────────────────────────────────────────────────

  describe('deleteSprint', () => {
    it('deletes a PLANNING sprint', async () => {
      sprintsRepo.findById.mockResolvedValue(makeSprint() as any);
      sprintsRepo.delete.mockResolvedValue(undefined as any);

      const result = await service.deleteSprint(SPRINT_ID, USER_ID);

      expect(sprintsRepo.delete).toHaveBeenCalledWith(SPRINT_ID);
      expect(result.success).toBe(true);
    });

    it('throws BadRequestException when trying to delete an ACTIVE sprint', async () => {
      sprintsRepo.findById.mockResolvedValue(
        makeSprint({ status: SprintStatus.ACTIVE }) as any,
      );

      await expect(service.deleteSprint(SPRINT_ID, USER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when sprint not found', async () => {
      sprintsRepo.findById.mockResolvedValue(null);

      await expect(service.deleteSprint('ghost', USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── updateSprint ────────────────────────────────────────────────────────────

  describe('updateSprint', () => {
    it('updates a PLANNING sprint', async () => {
      sprintsRepo.findById.mockResolvedValue(makeSprint() as any);
      const updated = makeSprint({ name: 'Updated Name' });
      sprintsRepo.update.mockResolvedValue(updated as any);

      const result = await service.updateSprint(
        SPRINT_ID,
        { name: 'Updated Name' },
        USER_ID,
      );

      expect(sprintsRepo.update).toHaveBeenCalled();
      expect(result.name).toBe('Updated Name');
    });

    it('throws BadRequestException when trying to update a COMPLETED sprint', async () => {
      sprintsRepo.findById.mockResolvedValue(
        makeSprint({ status: SprintStatus.COMPLETED }) as any,
      );

      await expect(
        service.updateSprint(SPRINT_ID, { name: 'New name' }, USER_ID),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── getBacklog ──────────────────────────────────────────────────────────────

  describe('getBacklog', () => {
    it('returns issues with no sprint for project members', async () => {
      const issues = [{ id: 'issue-1', title: 'Backlog issue', sprintId: null }];
      sprintsRepo.getBacklog.mockResolvedValue(issues as any);

      const result = await service.getBacklog(PROJECT_ID, USER_ID);

      expect(result).toEqual(issues);
      expect(sprintsRepo.getBacklog).toHaveBeenCalledWith(PROJECT_ID);
    });

    it('throws ForbiddenException for non-member', async () => {
      projectsRepo.isMember.mockResolvedValue(false);

      await expect(service.getBacklog(PROJECT_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
