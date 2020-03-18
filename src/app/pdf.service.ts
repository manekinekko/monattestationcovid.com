import { Injectable } from "@angular/core";
import * as moment from "moment";
moment.locale("fr-FR");

@Injectable({
  providedIn: "root"
})
export class PdfService {
  tpl: string;
  constructor() {
    this.prefetchTemplate();
  }

  async prefetchTemplate() {
    this.tpl = await (await fetch("/assets/template.html")).text();
  }

  download(iframe: HTMLIFrameElement, values: any) {
    let printableContent = this.tpl;
    printableContent = printableContent
      .replace(/#NAME#/, values.name)
      .replace(/#BIRTHDATE#/, moment(values.birthdate).format("LL"))
      .replace(/#ADDRESS#/, values.address)
      .replace(/#CITY#/, values.city)
      .replace(/#DATE#/, moment(values.date).format("LL"))
      .replace(/#SIGNATURE#/, values.signature);

    values.reasons.forEach(reason => {
      printableContent = printableContent.replace(
        new RegExp(`#${reason}#`),
        "☑"
      );
    });

    // clear all other non-selected reasons
    printableContent = printableContent.replace(/#\w#/g, "");

    iframe.contentDocument.documentElement.innerHTML = printableContent;

    // defer task
    setTimeout(_ => iframe.contentWindow.print());
  }
}
