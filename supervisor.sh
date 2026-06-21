#!/bin/bash
# Supervisor: fica em loop eterno checando o servidor a cada 30s e reinicia se cair.
cd /home/z/my-project
echo "$(date): supervisor iniciado" >> /home/z/my-project/supervisor.log

while true; do
  code=$(curl -s -m 3 -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
  if [ "$code" != "200" ]; then
    echo "$(date): servidor CAIU (HTTP $code), reiniciando..." >> /home/z/my-project/supervisor.log
    pkill -f "next dev" 2>/dev/null
    pkill -f "next-server" 2>/dev/null
    sleep 2
    nohup ./node_modules/.bin/next dev -p 3000 > /home/z/my-project/dev.log 2>&1 &
    disown
    # aguarda subir
    for i in $(seq 1 30); do
      code=$(curl -s -m 2 -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
      [ "$code" = "200" ] && break
      sleep 1
    done
    echo "$(date): servidor reiniciado (HTTP $code)" >> /home/z/my-project/supervisor.log
  fi
  sleep 30
done
