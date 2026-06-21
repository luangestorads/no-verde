#!/bin/bash
# Keepalive: reinicia o servidor Next.js se ele não estiver rodando.
# Rodado por cron a cada 1 minuto.
cd /home/z/my-project

# Verifica se a porta 3000 responde
code=$(curl -s -m 3 -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)

if [ "$code" = "200" ]; then
  echo "$(date): servidor OK (HTTP $code)" >> /home/z/my-project/keepalive.log
  exit 0
fi

# Servidor caiu — reinicia
echo "$(date): servidor CAIU (HTTP $code), reiniciando..." >> /home/z/my-project/keepalive.log
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null
sleep 2

# Inicia detached com setsid + nohup (máxima persistência)
nohup setsid bash -c 'exec ./node_modules/.bin/next dev -p 3000' </dev/null >/home/z/my-project/dev.log 2>&1 &
disown

# Aguarda subir
for i in $(seq 1 30); do
  code=$(curl -s -m 2 -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
  [ "$code" = "200" ] && break
  sleep 1
done
echo "$(date): servidor reiniciado (HTTP $code)" >> /home/z/my-project/keepalive.log
