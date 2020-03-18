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
      En application de l’article 1er du décret du 16 mars 2020 portant
      réglementation des déplacements dans le cadre de la lutte contre la
      propagation du virus Covid-19 :
    </p>
    <form novalidate [formGroup]="form">
      <section>
        <p>Je soussigné(e)</p>
        <main class="user-info">
          <mat-form-field appearance="outline">
            <mat-label>Mme / M.</mat-label>
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
            <mat-label>Demeurant</mat-label>
            <textarea rows="3" matInput formControlName="address"></textarea>
          </mat-form-field>
        </main>

        <main>
          <mat-hint>
            certifie que mon déplacement est lié au motif suivant (cocher la
            case) autorisé par l’article 1er du décret du 16 mars 2020 portant
            réglementation des déplacements dans le cadre de la lutte contre la
            propagation du virus Covid-19 :
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
              {{ reason.description }};
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

          <mat-form-field appearance="outline">
            <mat-label>Le</mat-label>
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
      .signature-pad {
        display: flex;
        justify-content: center;
        border-bottom: 1px solid lightgray;
        padding-bottom: 20px;
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
      description: `déplacements entre le domicile et le lieu d’exercice de l’activité
    professionnelle, lorsqu’ils sont indispensables à l’exercice
    d’activités ne pouvant être organisées sous forme de télétravail
    (sur justificatif permanent) ou déplacements professionnels ne
    pouvant être différés`,
      value: "a"
    },
    {
      description: `déplacements pour effectuer des achats de première nécessité dans
      des établissements autorisés (liste sur gouvernement.fr)`,
      value: "b"
    },
    {
      description: `déplacements pour motif de santé`,
      value: "c"
    },
    {
      description: `déplacements pour motif familial impérieux, pour l’assistance aux
      personnes vulnérables ou la garde d’enfants`,
      value: "d"
    },
    {
      description: `déplacements brefs, à proximité du domicile, liés à l’activité
      physique individuelle des personnes, à l’exclusion de toute
      pratique sportive collective, et aux besoins des animaux de
      compagnie`,
      value: "e"
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
    this.form = this.formBuilder.group({
      name: ["", Validators.required],
      birthdate: ["", Validators.required],
      address: ["", Validators.required],
      city: ["", Validators.required],
      date: [new Date(), Validators.required],
      reasons: ["", Validators.required],
      signature: [null, Validators.required],
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
