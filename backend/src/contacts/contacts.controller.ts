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
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Contacts')
@ApiBearerAuth()
@Controller('contacts')
@UseGuards(AuthGuard('jwt'))
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new contact' })
  @ApiResponse({ status: 201, description: 'Contact created successfully' })
  create(
    @Body() createContactDto: CreateContactDto,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.create(createContactDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all contacts (filtered by country for managers)' })
  @ApiQuery({ name: 'countryId', required: false })
  @ApiResponse({ status: 200, description: 'List of contacts' })
  findAll(
    @CurrentUser() user: any,
    @Query('countryId') countryId?: string,
  ) {
    return this.contactsService.findAll(user, countryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact by ID' })
  @ApiResponse({ status: 200, description: 'Contact details' })
  findOne(@Param('id') id: string) {
    return this.contactsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update contact' })
  @ApiResponse({ status: 200, description: 'Contact updated successfully' })
  update(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto) {
    return this.contactsService.update(id, updateContactDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete contact' })
  @ApiResponse({ status: 200, description: 'Contact deleted successfully' })
  remove(@Param('id') id: string) {
    return this.contactsService.remove(id);
  }
}
