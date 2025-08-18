(()=>{async function r(){try{let e=await(await fetch("/api/auth/me",{credentials:"include"})).json();return e.loggedIn&&e.user?e.user:null}catch(t){return null}}})();
