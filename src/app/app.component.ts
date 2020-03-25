import { Component, ElementRef, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatSelectionList } from "@angular/material/list";
import { interval } from "rxjs";
import { debounce, distinctUntilChanged } from "rxjs/operators";
import { LSService } from "./ls.service";
import { PdfService } from "./pdf.service";
import { SignatureData } from "./signature.component";

@Component({
  selector: "app-root",
  template: `
    <h1 class="center">ATTESTATION DE DÉPLACEMENT DÉROGATOIRE</h1>
    <p class="center">
      En application de l’article 3 du décret du 23 mars 2020 prescrivant les
      mesures générales nécessaires pour faire face à l’épidémie de Covid19 dans
      le cadre de l’état d’urgence sanitaire
    </p>
    <form novalidate [formGroup]="form">
      <section>
        <p>Je soussigné(e),</p>
        <main class="user-info">
          <mat-form-field appearance="outline">
            <mat-label>Mme/M.</mat-label>
            <input autocomplete="off" formControlName="name" matInput />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Né(e) le</mat-label>
            <input
              autocomplete="off"
              formControlName="birthdate"
              matInput
              [matDatepicker]="birthdatePicker"
            />
            <mat-datepicker-toggle
              matSuffix
              [for]="birthdatePicker"
            ></mat-datepicker-toggle>
            <mat-datepicker
              touchUi
              #birthdatePicker
              [startAt]="startAt"
            ></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>À</mat-label>
            <input matInput formControlName="birthcity" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Demeurant</mat-label>
            <textarea rows="3" matInput formControlName="address"></textarea>
          </mat-form-field>
        </main>

        <main>
          <mat-hint>
            certifie que mon déplacement est lié au motif suivant (cocher la
            case) autorisé par l’article 3 du décret du 23 mars 2020 prescrivant
            les mesures générales nécessaires pour faire face à l’épidémie de
            Covid19 dans le cadre de l’état d’urgence sanitaire<sup>1</sup> :
          </mat-hint>
          <mat-selection-list
            multiple="true"
            formControlName="reasons"
            color="primary"
          >
            <mat-list-option
              *ngFor="let reason of reasons"
              value="{{ reason.value }}"
            >
              <b>{{ reason.value }}</b>
              <span [innerHTML]="reason.description"></span>
            </mat-list-option>
          </mat-selection-list>
        </main>
      </section>

      <footer [formGroup]="form">
        <main class="signature-city-date">
          <mat-form-field appearance="outline">
            <mat-label>Fait à</mat-label>
            <input autocomplete="off" formControlName="city" matInput />
          </mat-form-field>

          <div class="date-time-section">
            <mat-form-field appearance="outline">
              <mat-label>Le (date)</mat-label>
              <input
                autocomplete="off"
                formControlName="date"
                matInput
                [matDatepicker]="signedOnDatePicker"
              />
              <mat-datepicker-toggle
                matSuffix
                [for]="signedOnDatePicker"
              ></mat-datepicker-toggle>
              <mat-datepicker touchUi #signedOnDatePicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>à (heure)</mat-label>
              <mat-select formControlName="time">
                <mat-option *ngFor="let time of daytime" [value]="time.value">
                  {{ time.description }}
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </main>
        <main class="signature-pad">
          <app-signature
            #signaturePad
            (onSignatureData)="onSignatureData($event)"
            (onSignatureClear)="onSignatureClear($event)"
            [signatureData]="form.controls.signatureData.value"
          ></app-signature>
          <input autocomplete="off" formControlName="signature" type="hidden" />
          <input
            autocomplete="off"
            formControlName="signatureData"
            type="hidden"
          />
        </main>

        <main class="action-buttons">
          <button
            mat-stroked-button
            (click)="signaturePad.clear()"
            color="warn"
          >
            Effacer Signature
          </button>
          <button
            color="primary"
            mat-stroked-button
            type="submit"
            (click)="downloadPDF()"
            [disabled]="shouldDisableButton()"
          >
            Télécharger le PDF
          </button>
        </main>
        <main class="footer-info">
          <p>
            <sup>1</sup> Les personnes souhaitant bénéficier de l'une de ces
            exceptions doivent se munir s’il y a lieu, lors de leurs
            déplacements hors de leur domicile, d'un document leur permettant de
            justifier que le déplacement considéré entre dans le champ de l'une
            de ces exceptions.
          </p>
          <p>
            <sup>2</sup> A utiliser par les travailleurs non-salariés,
            lorsqu’ils ne peuvent disposer d’un justificatif de déplacement
            établi par leur employeur.
          </p>
          <p>
            <sup>3</sup> Y compris les acquisitions à titre gratuit
            (distribution de denrées alimentaires...) et les déplacements liés à
            la perception de prestations sociales et au retrait d’espèces.
          </p>
        </main>
      </footer>
    </form>
    <iframe hidden src="/assets/template.html" #template></iframe>
  `,
  styles: [
    `
      h1 {
        font-weight: bold;
      }
      .center {
        text-align: center;
      }
      mat-form-field {
        width: 100%;
      }
      main {
        margin: 10px 0;
      }
      form {
        margin-top: 30px;
      }
      :host /deep/ .mat-list-option {
        height: auto !important;
        margin: 20px 0 20px;
      }
      :host /deep/ .mat-list-option b {
        background: #4153af;
        color: white;
        padding: 2px 10px !important;
        margin: 0px 14px 0 -16px !important;
        text-transform: uppercase;
      }

      :host /deep/ .mat-list-option {
        height: auto !important;
        margin: 20px 0 20px;
      }
      :host /deep/ [aria-selected="true"] {
        outline: solid !important;
        outline-color: #4153af !important;
        background: white;
      }
      :host /deep/ .mat-list-text {
        display: flex;
        flex-direction: row !important;
        overflow: visible !important;
      }
      :host /deep/ .mat-form-field-appearance-outline .mat-form-field-wrapper {
        margin: 0 !important;
      }
      .date-time-section {
        display: flex;
      }
      .date-time-section mat-form-field {
        margin: 0 5px 0 0;
      }
      .signature-pad {
        display: flex;
        justify-content: center;
        border-bottom: 1px solid lightgray;
        padding-bottom: 20px;
      }
      .footer-info {
        font-size: 12px;
      }
      footer {
        margin-top: 50px;
      }
      button {
        margin: 10px;
      }
      .action-buttons {
        display: flex;
        justify-content: center;
      }
    `
  ]
})
export class AppComponent {
  reasons = [
    {
      description: `Déplacements entre le domicile et le lieu d’exercice de l’activité professionnelle, lorsqu’ils sont indispensables à l’exercice d’activités ne pouvant être organisées sous forme de télétravail ou déplacements professionnels ne pouvant être différés<sup>2</sup>.`,
      value: 1
    },
    {
      description: `Déplacements pour effectuer des achats de fournitures nécessaires à l’activité professionnelle et des achats de première nécessité<sup>3</sup> dans des établissements dont les activités demeurent autorisées (liste sur gouvernement.fr).`,
      value: 2
    },
    {
      description: `Consultations et soins ne pouvant être assurés à distance et ne pouvant être différés ; consultations et soins des patients atteints d'une affection de longue durée.`,
      value: 3
    },
    {
      description: `Déplacements pour motif familial impérieux, pour l’assistance aux personnes vulnérables ou la garde d’enfants.`,
      value: 4
    },
    {
      description: `Déplacements brefs, dans la limite d'une heure quotidienne et dans un rayon maximal d'un kilomètre autour du domicile, liés soit à l'activité physique individuelle des personnes, à l'exclusion de toute pratique sportive collective et de toute proximité avec d'autres personnes, soit à la promenade avec les seules personnes regroupées dans un même domicile, soit aux besoins des animaux de compagnie.`,
      value: 5
    },
    {
      description: `Convocation judiciaire ou administrative.
      `,
      value: 6
    },
    {
      description: `Participation à des missions d’intérêt général sur demande de l’autorité administrative.
      `,
      value: 7
    }
  ];
  daytime = [
    {
      description: "6H",
      value: 6
    },
    {
      description: "7H",
      value: 7
    },
    {
      description: "8H",
      value: 8
    },
    {
      description: "9H",
      value: 9
    },
    {
      description: "10H",
      value: 10
    },
    {
      description: "11H",
      value: 11
    },
    {
      description: "Midi",
      value: 12
    },
    {
      description: "13H",
      value: 13
    },
    {
      description: "14H",
      value: 14
    },
    {
      description: "15H",
      value: 15
    },
    {
      description: "16H",
      value: 16
    },
    {
      description: "17H",
      value: 17
    },
    {
      description: "18H",
      value: 18
    },
    {
      description: "19H",
      value: 19
    },
    {
      description: "20H",
      value: 20
    },
    {
      description: "21H",
      value: 21
    },
    {
      description: "22H",
      value: 22
    },
    {
      description: "23H",
      value: 23
    },
    {
      description: "Minuit",
      value: 0
    },
    {
      description: "1H",
      value: 1
    },
    {
      description: "2H",
      value: "2"
    },
    {
      description: "3H",
      value: "3"
    },
    {
      description: "4H",
      value: "4"
    },
    {
      description: "5H",
      value: "5"
    }
  ];
  form: FormGroup;
  startAt: Date;
  @ViewChild(MatSelectionList, { static: true }) reasonsRef: MatSelectionList;
  @ViewChild("template", { static: true }) templateRef: ElementRef<
    HTMLIFrameElement
  >;

  constructor(
    private formBuilder: FormBuilder,
    private storage: LSService,
    private pdf: PdfService
  ) {
    const currentDate = new Date();
    this.form = this.formBuilder.group({
      name: ["", Validators.required],
      birthdate: ["", Validators.required],
      birthcity: ["", Validators.required],
      address: ["", Validators.required],
      city: ["", Validators.required],
      date: [currentDate, Validators.required],
      time: [currentDate.getHours(), Validators.required],
      reasons: ["", Validators.required],
      signature: [null],
      signatureData: [null]
    });

    // make Generation-Y happy :)
    this.startAt = new Date(1995, 0, 0);

    this.initializeForm();
  }

  ngOnInit() {
    this.form.valueChanges
      .pipe(
        distinctUntilChanged(),
        debounce(() => interval(500))
      )
      .subscribe(values => {
        this.storage.set("form", values);
      });
    this.loadSavedForm();

    // make sure to record the current date and time
    const currentDate = new Date();
    this.form.patchValue({
      date: currentDate,
      time: currentDate.getHours()
    });
  }

  initializeForm() {
    const storedForm = this.storage.get("form");

    if (Object.keys(storedForm).length === 0) {
      this.storage.set("form", this.form.value);
    }
  }

  loadSavedForm() {
    const storedForm = this.storage.get("form");

    if (Object.keys(storedForm).length > 0) {
      this.form.patchValue(storedForm);
    }
  }

  onSignatureData(data: SignatureData) {
    if (data) {
      this.form.patchValue({
        signature: data.signatureImage,
        signatureData: data.signatureData
      });
    }
  }

  onSignatureClear(isClear: boolean) {
    if (isClear) {
      this.form.patchValue({
        signature: null,
        signatureData: null
      });
    }
  }

  downloadPDF() {
    this.pdf.download(this.templateRef.nativeElement, this.form.value);
  }

  shouldDisableButton() {
    return this.form.invalid;
  }
}
