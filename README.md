# IMYD_WebApp

<b>Getting Started with IMYourDoc Web App</b>

<h2>Requirments </h2>
<ul>
	<li>Node v6.0.0 or later</li>
	<li>SSL certs (self signed-OK for development, see https://nodejs.org/api/tls.htmlhttps://nodejs.org/api/tls.html)</li>
	<li>For cookies to work, either deploy on an imyourdoc.com server or create a `me.imyourdoc.com 127.0.0.1` host file entry for your local machine so that you can access your local machine at that imyourdoc.com URL</li>
</ul>

### Install node modules at root of app
```bash
npm install
```
### Build app (from IMYourDoc_WebApp directory)
```bash
npm run dev

# Note you can also use:
# npm run qa
# npm run prod
```
### Start node proxy, pointing to the QA Java services
```bash
node proxy.js clientport=8443 socketport=443 socketip=s-qa.imyourdoc.com socketpath=/imyd-webchat-web authport=443 authip=s-qa.imyourdoc.com authpath=/imyd-auth-stateless-web serverport=443 serverip=s-qa.imyourdoc.com serverpath=/imyd-webchat-api \
	ssl sslcertpath=/path/to/cert sslcapath=/path/to/ca sslkeypath=/path/to/key
```
### Load it up in your browser
If you used the commands above, you should be able to load the app at https://me.imyourdoc.com:8443/

### Node arguments
| argument | description | PROD setting |
-----------|:-----------:|:------------:|
| clientport    |TCP port that the node proxy.js will listen on|443|
| clientip      |IP address that the node proxy.js will listen on|46.88.102.20|
| serverip      |domain name of server hosting imyd-webchat-api|s.imyourdoc.com|
| serverport    |port for that server|8443|
| socketip	|domain name of server for imyd-webchat-web|s.imyourdoc.com|
| socketport	|port for that server|8443|
| authip	|domain name of server for imyd-auth-stateless-web|s.imyourdoc.com
| authport	|port for that server|8443|
| ssl		|TODO |_default_|
| sslcertpath   |TODO |_default_|
| sslkeypath    |TODO |_default_|
| imageserverip |domain name of server holding attachment/image files|api.imyourdoc.com|
| prod		|TODO |_default_|


Committing your changes
-----------------------

When your modifications are ready (meaning they build successfully and all automated tests pass), commit the changes to this repository.
The steps are:

1. `git add` the changed files that should be included in the commit.

2. `git commit` Enter a brief commit message that explains your changes. You can mark the related Pivotal story as "Finished" by including the text 
```
[Finishes #PIVOTAL\_STORY\_ID]
```
in your commit message.
This saves you time, keeps our list of in-progress Pivotal stories short, and has the added benefit of recording which git commit relates to which Pivotal stories.  If your commit doesn't quite finish the Pivotal story (maybe there are dependent changes in other projects) you should still relate your commit to the Pivotal story it implements like this:
```
[#PIVOTAL\_STORY\_ID]
```

3. `git push` your commit up to Github and smile!


Production Configuration
------------------------

Currently, we are running this app in production under pm2 on the API server machine.  Key things to know:
- Home directory is /opt/imyd-webchat-node
- Service runs as user "node"
- `sudo setcap cap_net_bind_service=+ep /usr/bin/node` is required so that node can listen on port 443
- Initial startup is done while logged in as the node user: `pm2 start webchat.yml`
- Then, make sure that pm2 remembers our application across server restarts: `pm2 save`
- The /etc/init.d/pm2-init.sh init script will make sure that pm2 starts at reboot and will `pm2 resurrect` webchat.
- That script can be used to manage pm2 like any other daemon, e.g. `sudo service pm2-init.sh restart`

