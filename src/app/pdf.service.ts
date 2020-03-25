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
    let time = values.time;
    if (time === 12) {
      time = `${values.time}h (midi)`;
    } else if (time === 0) {
      time = `${values.time}h (minuit)`;
    } else {
      time = `${values.time} h`;
    }
    printableContent = printableContent
      .replace(/#NAME#/, values.name)
      .replace(/#BIRTHDATE#/, moment(values.birthdate).format("LL"))
      .replace(/#BIRTHCITY#/, values.birthcity)
      .replace(/#ADDRESS#/, values.address)
      .replace(/#CITY#/, values.city)
      .replace(/#DATE#/, moment(values.date).format("LL"))
      .replace(/#TIME#/, time)
      .replace(/#SIGNATURE#/, values.signature);

    values.reasons.forEach(reason => {
      printableContent = printableContent.replace(
        new RegExp(`<span class="checkbox">${reason}<\/span>`),
        `<span class="checkbox">✔</span>`
      );
    });

    // clear all other non-selected reasons
    printableContent = printableContent.replace(
      /<span class="checkbox">\d<\/span>/g,
      `<span class="checkbox"></span>`
    );

    iframe.contentDocument.documentElement.innerHTML = printableContent;

    // defer task
    setTimeout(_ => iframe.contentWindow.print());
  }
}
