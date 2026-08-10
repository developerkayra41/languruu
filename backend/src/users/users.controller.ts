import { AvatarUploadUrlDto } from './dto/request/AvatarUploadUrl.request.dto';
import { Body, Controller, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { BaseController } from 'src/_base/base.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/_common/guards/JwtAuthGuard';
import { UpdateProfileRequestDTO } from './dto/request/UpdateProfile.request.dto';
import { UpdateEmailRequestDTO } from './dto/request/UpdateEmail.request.dto';
import { UpdatePasswordRequestDTO } from './dto/request/UpdatePassword.request.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetPublicProfileRequestDTO } from './dto/request/GetPublicProfile.request.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController extends BaseController {
  constructor(private readonly usersService: UsersService) {
    super('UsersController');
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  @ApiOperation({ summary: 'profile API', description: 'Bu API userin profil bilgilerini getirir' })
  async getProfile(@Req() req) {
    const result = await this.usersService.getProfile(req.user.id);
    return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
  }

  @Post('public-profile')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'public-profile API', description: 'Bir kullanıcının herkese açık profil bilgilerini getirir' })
  @ApiBody({ type: GetPublicProfileRequestDTO })
  async getPublicProfile(@Req() req, @Body() body: GetPublicProfileRequestDTO) {
    const result = await this.usersService.getPublicProfile(body.user_name);
    return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile/update')
  @ApiBody({ type: UpdateProfileRequestDTO })
  @ApiOperation({ summary: 'profile/update API', description: 'Bu API userin usernamesini günceller' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateProfile(@Req() req, @Body() body: UpdateProfileRequestDTO) {
    const result = await this.usersService.updateProfile(req.user.id, body);
    return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
  }

  @UseGuards(JwtAuthGuard)
  @Post('avatar/upload-url')
  @ApiBody({ type: AvatarUploadUrlDto })
  @ApiOperation({ summary: 'avatar/upload-url API', description: 'Bu API userin avatarını günceller' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async getAvatarUploadUrl(@Req() req, @Body() body: AvatarUploadUrlDto) {
    const result = await this.usersService.createAvatarUploadUrl(req.user.id, body.extension);
    return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
  }

  @UseGuards(JwtAuthGuard)
  @Post('avatar/delete')
  @ApiOperation({ summary: 'avatar/delete-url API', description: 'Bu API userin avatarını siler' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async deleteAvatar(@Req() req) {
    const result = await this.usersService.deleteAvatar(req.user.id, req);
    return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
  }

  @UseGuards(JwtAuthGuard)
  @Post('settings/email')
  @ApiBody({ type: UpdateEmailRequestDTO })
  @ApiOperation({ summary: 'settings/email API', description: 'Bu API userin emailini günceller' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateEmail(@Req() req, @Body() body: UpdateEmailRequestDTO) {
    const result = await this.usersService.updateEmail(req.user.id, body.new_email, body.current_password);
    return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
  }

  @UseGuards(JwtAuthGuard)
  @Post('study/complete')
  @ApiOperation({ summary: 'study/complete API', description: 'Bir grup tamamlanınca günlük seri + tamamlanan tur sayacını günceller' })
  async recordStudyComplete(@Req() req) {
    await this.usersService.recordStudyCompletion(req.user.id);
    return this.createSuccessResponse({ data: null, message: 'success', success: true }, req);
  }

  @UseGuards(JwtAuthGuard)
  @Post('settings/password')
  @ApiBody({ type: UpdatePasswordRequestDTO })
  @ApiOperation({ summary: 'settings/password API', description: 'Bu API userin şifresini günceller' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updatePassword(@Req() req, @Body() body: UpdatePasswordRequestDTO) {
    const result = await this.usersService.updatePassword(req.user.id, body.current_password, body.new_password);
    return this.createSuccessResponse({ data: result, message: 'success', success: true }, req);
  }
}
