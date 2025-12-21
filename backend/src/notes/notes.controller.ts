import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Notes')
@ApiBearerAuth()
@Controller('notes')
@UseGuards(AuthGuard('jwt'))
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new note' })
  @ApiResponse({ status: 201, description: 'Note created successfully' })
  create(@Body() createNoteDto: CreateNoteDto, @CurrentUser() user: any) {
    return this.notesService.create(createNoteDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get notes by deal' })
  @ApiQuery({ name: 'dealId', required: true })
  @ApiResponse({ status: 200, description: 'List of notes' })
  findByDeal(@Query('dealId') dealId: string) {
    return this.notesService.findByDeal(dealId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get note by ID' })
  @ApiResponse({ status: 200, description: 'Note details' })
  findOne(@Param('id') id: string) {
    return this.notesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update note' })
  @ApiResponse({ status: 200, description: 'Note updated successfully' })
  update(@Param('id') id: string, @Body() updateNoteDto: UpdateNoteDto) {
    return this.notesService.update(id, updateNoteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete note' })
  @ApiResponse({ status: 200, description: 'Note deleted successfully' })
  remove(@Param('id') id: string) {
    return this.notesService.remove(id);
  }
}
