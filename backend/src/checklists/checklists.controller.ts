import { Controller, Get, Post, Patch, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChecklistsService } from './checklists.service';
import { CreateChecklistDto, UpdateChecklistDto, CreateChecklistItemDto, UpdateChecklistItemDto } from './checklists.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class ChecklistsController {
  constructor(private checklistsService: ChecklistsService) {}

  @Get('issues/:issueId/checklists')
  getChecklists(@Param('issueId') issueId: string, @Req() req: any) {
    return this.checklistsService.getChecklists(issueId, req.user.id);
  }

  @Post('issues/:issueId/checklists')
  createChecklist(
    @Param('issueId') issueId: string,
    @Body() dto: CreateChecklistDto,
    @Req() req: any,
  ) {
    return this.checklistsService.createChecklist(issueId, dto, req.user.id);
  }

  @Patch('checklists/:id')
  updateChecklist(@Param('id') id: string, @Body() dto: UpdateChecklistDto, @Req() req: any) {
    return this.checklistsService.updateChecklist(id, dto, req.user.id);
  }

  @Delete('checklists/:id')
  deleteChecklist(@Param('id') id: string, @Req() req: any) {
    return this.checklistsService.deleteChecklist(id, req.user.id);
  }

  @Post('checklists/:checklistId/items')
  createItem(
    @Param('checklistId') checklistId: string,
    @Body() dto: CreateChecklistItemDto,
    @Req() req: any,
  ) {
    return this.checklistsService.createItem(checklistId, dto, req.user.id);
  }

  @Patch('checklist-items/:itemId')
  updateItem(@Param('itemId') itemId: string, @Body() dto: UpdateChecklistItemDto, @Req() req: any) {
    return this.checklistsService.updateItem(itemId, dto, req.user.id);
  }

  @Delete('checklist-items/:itemId')
  deleteItem(@Param('itemId') itemId: string, @Req() req: any) {
    return this.checklistsService.deleteItem(itemId, req.user.id);
  }
}
