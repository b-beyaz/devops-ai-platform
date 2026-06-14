{{/*
Uygulama adı
*/}}
{{- define "dropbox.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Tam release adı
*/}}
{{- define "dropbox.fullname" -}}
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

{{/*
Chart etiketi
*/}}
{{- define "dropbox.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Ortak etiketler
*/}}
{{- define "dropbox.labels" -}}
helm.sh/chart: {{ include "dropbox.chart" . }}
{{ include "dropbox.selectorLabels" . }}
app.kubernetes.io/version: {{ .Values.image.tag | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector etiketleri
*/}}
{{- define "dropbox.selectorLabels" -}}
app.kubernetes.io/name: {{ include "dropbox.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
MySQL Adı
*/}}
{{- define "mysql.fullname" -}}
{{- printf "%s-mysql" (include "dropbox.fullname" .) }}
{{- end }}

{{/*
MySQL Ortak etiketler
*/}}
{{- define "mysql.labels" -}}
helm.sh/chart: {{ include "mysql.chart" . }}
{{ include "mysql.selectorLabels" . }}
app.kubernetes.io/version: {{ .Values.image.tag | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
MySQL Selector etiketleri
*/}}
{{- define "mysql.selectorLabels" -}}
app.kubernetes.io/name: {{ include "mysql.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "mysql.name" -}}
{{- printf "%s-mysql" (include "dropbox.name" .) }}
{{- end }}

{{- define "mysql.chart" -}}
{{- include "dropbox.chart" . }}
{{- end }}

{{/*
MySQL servis adresi
*/}}
{{- define "dropbox.mysqlHost" -}}
{{- if .Values.database.host }}
{{- .Values.database.host }}
{{- else }}
{{- printf "%s-mysql" .Release.Name }}
{{- end }}
{{- end }}

{{/*
JDBC URL
*/}}
{{- define "dropbox.jdbcUrl" -}}
{{- printf "jdbc:mysql://%s:%s/%s?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC" (include "dropbox.mysqlHost" .) .Values.database.port .Values.database.name }}
{{- end }}
