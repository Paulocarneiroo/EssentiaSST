-- CreateEnum
CREATE TYPE "tipo_exame" AS ENUM ('ADMISSIONAL', 'PERIODICO', 'RETORNO_TRABALHO', 'MUDANCA_RISCO', 'DEMISSIONAL');

-- CreateEnum
CREATE TYPE "resultado_aso" AS ENUM ('APTO', 'INAPTO', 'APTO_COM_RESTRICOES');

-- CreateEnum
CREATE TYPE "tipo_risco" AS ENUM ('FISICO', 'QUIMICO', 'BIOLOGICO', 'ERGONOMICO', 'ACIDENTE');

-- CreateEnum
CREATE TYPE "tipo_evento_esocial" AS ENUM ('S_2210', 'S_2220', 'S_2240');

-- CreateEnum
CREATE TYPE "status_evento_esocial" AS ENUM ('PENDENTE', 'ENVIADO', 'ACEITO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "ambiente_esocial" AS ENUM ('PRODUCAO', 'PRODUCAO_RESTRITA');

-- CreateTable
CREATE TABLE "asos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "colaborador_id" UUID NOT NULL,
    "tipo_exame" "tipo_exame" NOT NULL,
    "data_exame" DATE NOT NULL,
    "resultado" "resultado_aso" NOT NULL,
    "medico" VARCHAR(255) NOT NULL,
    "crm" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "asos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "riscos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "empresa_id" UUID NOT NULL,
    "descricao" VARCHAR(500) NOT NULL,
    "tipo" "tipo_risco" NOT NULL,
    "severidade" INTEGER NOT NULL,
    "probabilidade" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "riscos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_esocial" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "empresa_id" UUID NOT NULL,
    "colaborador_id" UUID,
    "aso_id" UUID,
    "risco_id" UUID,
    "tipo_evento" "tipo_evento_esocial" NOT NULL,
    "payload_xml" TEXT NOT NULL,
    "status" "status_evento_esocial" NOT NULL DEFAULT 'PENDENTE',
    "ambiente" "ambiente_esocial" NOT NULL,
    "protocolo" VARCHAR(60),
    "mensagem_erro" TEXT,
    "data_envio" TIMESTAMPTZ(6),
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "eventos_esocial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asos_colaborador_id_idx" ON "asos"("colaborador_id");

-- CreateIndex
CREATE INDEX "riscos_empresa_id_idx" ON "riscos"("empresa_id");

-- CreateIndex
CREATE INDEX "eventos_esocial_empresa_id_idx" ON "eventos_esocial"("empresa_id");

-- CreateIndex
CREATE INDEX "eventos_esocial_empresa_id_status_idx" ON "eventos_esocial"("empresa_id", "status");

-- CreateIndex
CREATE INDEX "eventos_esocial_aso_id_idx" ON "eventos_esocial"("aso_id");

-- CreateIndex
CREATE INDEX "eventos_esocial_risco_id_idx" ON "eventos_esocial"("risco_id");

-- AddForeignKey
ALTER TABLE "asos" ADD CONSTRAINT "asos_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "colaboradores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riscos" ADD CONSTRAINT "riscos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_esocial" ADD CONSTRAINT "eventos_esocial_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_esocial" ADD CONSTRAINT "eventos_esocial_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_esocial" ADD CONSTRAINT "eventos_esocial_aso_id_fkey" FOREIGN KEY ("aso_id") REFERENCES "asos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_esocial" ADD CONSTRAINT "eventos_esocial_risco_id_fkey" FOREIGN KEY ("risco_id") REFERENCES "riscos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

