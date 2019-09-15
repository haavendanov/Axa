import { Injectable, HttpService, BadGatewayException } from '@nestjs/common';
import { SendInsurancePlanDto } from './dto/send-insurance-plan.dto';
import * as nodemailer from "nodemailer";

@Injectable()
export class AppService {

  private plan_string = {
    '18': 'Emermédica',
    '17': 'Salud Ideal',
    '26': 'Plan Ambulatorio',
    '13': 'Medicina Prepagada - Plan Alterno Plus',
    '11': 'Medicina Prepagada - Plan Original Plus',
    '15': 'Medicina Prepagada - Plan Fesalud Plus',
  }

  config = require("../config.json")

  constructor(
    private readonly httpService: HttpService,
  ) {}

  root(): string {
    return 'Hello World!';
  }

  async login() {
    const qs = require('qs');
    const cheerio = require('cheerio')

    let sessionId = '';
    let ASPsessionId = '';

    return this.httpService.request({
      method: 'post',
      url: 'https://sucursalenlinea.axacolpatria.co/home?p_p_id=LoginPortlet_WAR_authenticationportlet&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_cacheability=cacheLevelPage&p_p_col_id=column-1&p_p_col_count=2&_LoginPortlet_WAR_authenticationportlet_CMD=auth',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: qs.stringify({
        '_LoginPortlet_WAR_authenticationportlet_formDate': Date.now().toString(),
        '_LoginPortlet_WAR_authenticationportlet_docType': 'CC',
        '_LoginPortlet_WAR_authenticationportlet_docNumber': '52705935',
        '_LoginPortlet_WAR_authenticationportlet_password': 'LSM19mre',
      }),
    })
    .toPromise()
    .then((r) => {
      sessionId = r.headers['set-cookie'][0].split('=')[1].split(';')[0];
      return this.httpService.request({
        method: 'post',
        url: 'https://sucursalenlinea.axacolpatria.co/home?p_p_id=LoginPortlet_WAR_authenticationportlet&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-1&p_p_col_count=2&_LoginPortlet_WAR_authenticationportlet_javax.portlet.action=loginAction',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': 'JSESSIONID=' + sessionId,
        },
        data: qs.stringify({
          '_LoginPortlet_WAR_authenticationportlet_formDate': Date.now().toString(),
          '_LoginPortlet_WAR_authenticationportlet_login': 'cc52705935',
        }),
        withCredentials: true
      })
      .toPromise()
      .then(() => {
        return this.httpService.request({
          method: 'post',
          url: 'https://sucursalenlinea.axacolpatria.co/profile-selector?p_p_id=ProfileSelectorPortlet_WAR_authenticationportlet&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-1&p_p_col_count=1&_ProfileSelectorPortlet_WAR_authenticationportlet_javax.portlet.action=chooseProfile',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': 'JSESSIONID=' + sessionId,
          },
          data: qs.stringify({
            '_ProfileSelectorPortlet_WAR_authenticationportlet_formDate': Date.now().toString(),
            '_ProfileSelectorPortlet_WAR_authenticationportlet_profileSelection': 'APN',
            '_ProfileSelectorPortlet_WAR_authenticationportlet_keySelection': '54007',
          }),
          withCredentials: true
        })
        .toPromise()
        .then(() => {
          return this.httpService.request({
            method: 'get',
            url: 'https://sucursalenlinea.axacolpatria.co/group/guest/herramientas/gestor-de-ventas/salud',
            headers: {
              'Cookie': 'JSESSIONID=' + sessionId,
            },
            withCredentials: true
          })
          .toPromise()
          .then((r) => {
            const $ = cheerio.load(r.data)
            return this.httpService.request({
              method: 'post',
              url: 'https://pws.axacolpatria.co/PortalAsesor/health/SessionTransferRedirect',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': 'JSESSIONID=' + sessionId,
              },
              data: qs.stringify({
                'sGUID': $('input[name="sGUID"]').val(),
              }),
              withCredentials: true,
              maxRedirects: 0,
            })
            .toPromise()
            .then((response1) => {
              console.log(response1);
            })
            .catch( (err) => {
              ASPsessionId = err.response.headers['set-cookie'][0].split('=')[1].split(';')[0];
              return this.httpService.request({
                method: 'get',
                url: 'https://pws.axacolpatria.co/PortalAsesor/health/Step_01',
                headers: {
                  'Cookie': 'ASP.NET_SessionId=' + ASPsessionId,
                },
              })
              .toPromise()
              .then((response) => {
                const html = cheerio.load(response.data);
                return this.httpService.request({
                  method: 'post',
                  url: ' https://pws.axacolpatria.co/PortalAsesor/Health/Step_01',
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cookie': 'ASP.NET_SessionId=' + ASPsessionId,
                  },
                  data: qs.stringify({
                    'opcion1': '83',
                    'opcion2': '2',
                    'opcion3': '1',
                    'opcion4': '1',
                    'as_ffc_field': html('input[name="as_ffc_field"]').val(),
                    'as_sfid': html('input[name="as_sfid"]').val(),
                    'as_fid': html('input[name="as_fid"]').val(),
                  }),
                  withCredentials: true,
                })
                .toPromise()
                .then(() => ASPsessionId)
              })
            });
          })
          .catch( () => {
            throw new BadGatewayException();
          });
        })
        .catch( () => {
          throw new BadGatewayException();
        });
      });
    })
    .catch( (e) => {
      console.log(e);
      throw new BadGatewayException();
    });
  }

  sendPlan(sendInsurancePlanDto: SendInsurancePlanDto, planId, sessionId): Promise<any> {
    const qs = require('qs');

    return this.httpService.request({
      method: 'post',
      url: 'https://pws.axacolpatria.co/PortalAsesor/Health/Quote',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': `ASP.NET_SessionId=${sessionId}`,
      },
      data: qs.stringify({
        'IdPlanSelected': planId,
        'ContractorEmail.Name': sendInsurancePlanDto.first_name,
        'ContractorEmail.LastName': sendInsurancePlanDto.last_name,
        'ContractorEmail.Phone': sendInsurancePlanDto.phone,
        'ContractorEmail.Email': this.config.email,
        'inpNumRows': '1',
        'lstBenefs[0].Row': '1',
        'lstBenefs[0].isUser': 'True',
        'lstBenefs[0].Name': sendInsurancePlanDto.first_name + ' ' + sendInsurancePlanDto.last_name,
        'lstBenefs[0].Age': sendInsurancePlanDto.age,
        'lstBenefs[0].Gender': sendInsurancePlanDto.gender,
        'inp_opcion_0': false
      }),
    })
    .toPromise()
    .then(() => {
      return this.httpService.request({
        method: 'post',
        url: 'https://pws.axacolpatria.co/PortalAsesor/Health/SendMail',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': `ASP.NET_SessionId=${sessionId}`,
        },
        data: qs.stringify({
          'IdPlanSelected': planId,
          'ContractorEmail.Name': sendInsurancePlanDto.first_name,
          'ContractorEmail.LastName': sendInsurancePlanDto.last_name,
          'ContractorEmail.Phone': sendInsurancePlanDto.phone,
          'ContractorEmail.Email': this.config.email,
          'inpNumRows': '1',
          'lstBenefs[0].Row': '1',
          'lstBenefs[0].isUser': 'True',
          'lstBenefs[0].Name': sendInsurancePlanDto.first_name + ' ' + sendInsurancePlanDto.last_name,
          'lstBenefs[0].Age': sendInsurancePlanDto.age,
          'lstBenefs[0].Gender': sendInsurancePlanDto.gender,
          'inp_opcion_0': false
        }),
        withCredentials: true,
      }).toPromise()
      .then(() => {
        return true
      })
    })
    .catch( (error) => {
      console.log(error)
      throw new BadGatewayException();
    });
  }

  sendToCRM(sendInsurancePlanDto: SendInsurancePlanDto, planIds): Promise<any> {
    const qs = require('qs');

    const full_plan_strings = planIds.map(plan => this.plan_string[plan]);

    const data = 
      '<Leads>' +
        '<row no="1">' +
          '<FL val="First Name">' + sendInsurancePlanDto.first_name + '</FL>' +
          '<FL val="Last Name">' + sendInsurancePlanDto.last_name + '</FL>' +
          '<FL val="Email">' + sendInsurancePlanDto.email + '</FL>' +
          '<FL val="Phone">' + sendInsurancePlanDto.phone + '</FL>' +
          '<FL val="Edad">' + sendInsurancePlanDto.age + '</FL>' +
          '<FL val="Género">' + sendInsurancePlanDto.gender + '</FL>' +
          '<FL val="Plan">' + full_plan_strings.toString() + '</FL>' +
        '</row>' +
      '</Leads>';
    const queryData =  qs.stringify({
        authtoken: this.config.zoho_token,
        scope: 'crmapi',
        xmlData: data
      })

    return this.httpService.request({
      method: 'post',
      url: `https://crm.zoho.com/crm/private/xml/Leads/insertRecords?${queryData}`,
      data: {},
    })
    .toPromise()
    .then(() => {
      return true;
    })
    .catch( (error) => {
      throw new BadGatewayException();
    });
  }

  async sendZohoFailureMail(sendInsurancePlanDto: SendInsurancePlanDto) {
    const full_plan_strings = sendInsurancePlanDto.plans.map(plan => this.plan_string[plan]);

    let mailOptions = {
      from: this.config.email,
      to: this.config.email,
      subject: `Falló zoho para ${sendInsurancePlanDto.first_name} ${sendInsurancePlanDto.last_name}`,
      html: "<b>El envío del lead a ZOHO falló, los datos son:</b> <br>" + 
      "<br><b>Nombre: </b>" + sendInsurancePlanDto.first_name +
      "<br><b>Apellido: </b>" + sendInsurancePlanDto.last_name +
      "<br><b>Email: </b>" + sendInsurancePlanDto.email +
      "<br><b>Género: </b>" + sendInsurancePlanDto.gender +
      "<br><b>Edad: </b>" + sendInsurancePlanDto.age +
      "<br><b>Teléfono: </b>" + sendInsurancePlanDto.phone +
      "<br><b>Planes: </b>" + full_plan_strings.toString()
    };

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: this.config.email_config.user,
        pass: this.config.email_config.app_pass
      }
    });

    await transporter.sendMail(mailOptions);
  }

  async sendAxaFailureMail(sendInsurancePlanDto: SendInsurancePlanDto) {
    const full_plan_strings = sendInsurancePlanDto.plans.map(plan => this.plan_string[plan]);

    let mailOptions = {
      from: this.config.email,
      to: this.config.email,
      subject: `Falló Axa para ${sendInsurancePlanDto.first_name} ${sendInsurancePlanDto.last_name}`,
      html: "<b>El envío del lead a Axa falló, los datos son:</b> <br>" + 
      "<br><b>Nombre: </b>" + sendInsurancePlanDto.first_name +
      "<br><b>Apellido: </b>" + sendInsurancePlanDto.last_name +
      "<br><b>Email: </b>" + sendInsurancePlanDto.email +
      "<br><b>Género: </b>" + sendInsurancePlanDto.gender +
      "<br><b>Edad: </b>" + sendInsurancePlanDto.age +
      "<br><b>Teléfono: </b>" + sendInsurancePlanDto.phone +
      "<br><b>Planes: </b>" + full_plan_strings.toString()
    };

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
          user: this.config.email_config.user,
          pass: this.config.email_config.app_pass
      }
    });

    await transporter.sendMail(mailOptions);
  }
}
