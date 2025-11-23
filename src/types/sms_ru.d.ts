declare module "sms_ru" {
  type SmsSendOptions = {
    to?: string;
    text?: string;
    from?: string;
    time?: number;
    translit?: boolean;
    test?: boolean;
    partner_id?: string | number;
    multi?: [string, string][];
  };

  type SmsRuCallback = (response?: unknown) => void;

  class SMSru {
    constructor(apiId: string);
    constructor(login: string, password: string);
    sms_send(options: SmsSendOptions, callback: SmsRuCallback): void;
  }

  export default SMSru;
}
