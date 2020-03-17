import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Inject
} from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
export interface SignatureData {
  signatureData: string[];
  signatureImage: string;
}

@Component({
  selector: "app-dialog-signature",
  template: `
    <section class="portrait-info">
      Merci de retourner votre téléphone pour signer.
    </section>
    <section class="signature-block">
      <h2>Signature</h2>
      <canvas width="370" height="200" #signature></canvas>
      <p class="action-buttons">
        <button mat-stroked-button (click)="clear()" color="warn">
          Effacer
        </button>
        <button mat-stroked-button (click)="save()" color="primary">
          Valider et fermer
        </button>
      </p>
    </section>
  `,
  styles: [
    `
      canvas {
        border: 1px solid gray;
      }
      button {
        margin: 10px;
      }
      .action-buttons {
        display: flex;
        justify-content: center;
      }
      .portrait-info {
        display: none;
      }

      @media screen and (max-width: 600px) and (orientation: portrait) {
        .portrait-info {
          display: block;
        }
        .signature-block {
          display: none;
        }
      }
      @media (orientation: landscape) {
        .portrait-info {
          display: none;
        }
        .signature-block {
          display: block;
        }
      }
    `
  ]
})
export class SignatureComponent implements OnInit {
  @ViewChild("signature", { static: true }) signatureRef: ElementRef<
    HTMLCanvasElement
  >;

  signaturePad: any;

  constructor(
    public dialogRef: MatDialogRef<SignatureComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SignatureData
  ) {}

  ngOnInit(): void {
    this.signaturePad = new window["SignaturePad"](
      this.signatureRef.nativeElement
    );
  }

  save() {
    let png = this.signaturePad.toDataURL();
    let data = this.signaturePad.toData();
    this.dialogRef.close({
      signatureData: data,
      signatureImage: png
    } as SignatureData);
  }
  clear() {
    this.signaturePad.clear();
  }
}
