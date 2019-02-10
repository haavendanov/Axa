import { Get, Post, Controller, Body, UsePipes, ValidationPipe, BadGatewayException } from '@nestjs/common';
import { AppService } from './app.service';
import { SendInsurancePlanDto } from './dto/send-insurance-plan.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  root(): string {
    return this.appService.root();
  }

  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() sendInsurancePlanDto: SendInsurancePlanDto): Promise<any>{
    try{
      this.appService.sendToCRM(sendInsurancePlanDto, sendInsurancePlanDto.plans);      
      this.appService.login().then(async sessionId => {
        for (const plan of sendInsurancePlanDto.plans) {
          await this.appService.sendPlan(sendInsurancePlanDto, plan, sessionId)
          .catch(err => console.log(err));
        }
      }).catch( (error) => console.log(error));
    } catch (e) {
      throw new BadGatewayException(e);
    }
  }
}
