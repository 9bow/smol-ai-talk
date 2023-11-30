## install

```bash
pnpm install
cp .env.example .env # fill out env vars

# if running colima instead of docker
sudo ln -sf ~/.colima/docker.sock /var/run/docker.sock      # https://github.com/abiosoft/colima/issues/144#issuecomment-1024419024
colima start # if you want to run supabase docker container locally


# if setting up supabase for first time
supabase db reset
```

## discord token

to obtain token: basically login on discord, snoop devtools for auth header bearer token https://www.androidauthority.com/get-discord-token-3149920/

**you also have to join every discord** that is referenced  in the `script.ts` list., maybe worth splitting that out to a separate file...