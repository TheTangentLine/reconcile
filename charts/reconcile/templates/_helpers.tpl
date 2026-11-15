{{- define "reconcile.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "reconcile.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{- define "reconcile.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/* Common labels. Call with (dict "ctx" $ "component" "backend"). */}}
{{- define "reconcile.labels" -}}
helm.sh/chart: {{ include "reconcile.chart" .ctx }}
{{ include "reconcile.selectorLabels" . }}
app.kubernetes.io/managed-by: {{ .ctx.Release.Service }}
app.kubernetes.io/part-of: reconcile
{{- end }}

{{- define "reconcile.selectorLabels" -}}
app.kubernetes.io/name: {{ include "reconcile.name" .ctx }}
app.kubernetes.io/instance: {{ .ctx.Release.Name }}
app.kubernetes.io/component: {{ .component }}
{{- end }}

{{/* repository:tag, failing early if CI hasn't filled in the tag yet. */}}
{{- define "reconcile.image" -}}
{{- $tag := required (printf "%s.image.tag is empty; it is set by CI after the first image build" .component) .image.tag -}}
{{- printf "%s:%s" .image.repository $tag }}
{{- end }}

{{- define "reconcile.mongodb.fullname" -}}
{{- printf "%s-mongodb" (include "reconcile.fullname" .) }}
{{- end }}

{{- define "reconcile.mongodb.secretName" -}}
{{- default (include "reconcile.mongodb.fullname" .) .Values.mongodb.auth.existingSecret }}
{{- end }}
