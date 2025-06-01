"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
Select,
SelectTrigger,
SelectValue,
SelectContent,
SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const supabase = createClient(
"[https://vlmxcyputvvxfccegyae.supabase.co](https://vlmxcyputvvxfccegyae.supabase.co)",
"vyivZGM5pwMoV8JdPP3Wq0lJGz7HBJPHjYO9OTK6epustMoT6z6if293MEvltcBzJe87J60dU82SLLt8EYUInA=="
);

export default function KioskForm() {
const \[users, setUsers] = useState(\[]);
const \[products, setProducts] = useState(\[]);
const \[loginName, setLoginName] = useState("");
const \[password, setPassword] = useState("");
const \[user, setUser] = useState(null);
const \[produkt, setProdukt] = useState("");
const \[menge, setMenge] = useState("1");
const \[submitted, setSubmitted] = useState(false);
const \[loginError, setLoginError] = useState("");
const \[newProductName, setNewProductName] = useState("");
const \[newProductPrice, setNewProductPrice] = useState("");
const \[newProductEK, setNewProductEK] = useState("");
const \[newProductBestand, setNewProductBestand] = useState("");
const \[guthabenAufladen, setGuthabenAufladen] = useState("");

useEffect(() => {
const fetchData = async () => {
const { data: usersData } = await supabase.from("users").select("*");
setUsers(usersData || \[]);
const { data: productsData } = await supabase.from("produkte").select("*");
setProducts(productsData || \[]);
};
fetchData();
}, \[]);

const handleLogin = () => {
const match = users.find(u => u.name === loginName && u.password === password);
if (match) {
setUser(match);
setLoginError("");
} else {
setLoginError("Falscher Name oder Passwort");
}
};

const handleSubmit = async () => {
const mengeNum = parseInt(menge);
const product = products.find(p => p.name === produkt);
if (!product || !user) return;

```
const neuerBestand = product.bestand - mengeNum;
const gesamtPreis = parseFloat(product.preis) * mengeNum;
const gewinn = (parseFloat(product.preis) - parseFloat(product.ek)) * mengeNum;
const neuesGuthaben = parseFloat(user.guthaben) - gesamtPreis;

if (neuesGuthaben < 0) {
  alert("Nicht genug Guthaben!");
  return;
}

await supabase.from("verkaeufe").insert([
  {
    user_id: user.id,
    produkt_id: product.id,
    menge: mengeNum,
    zeit: new Date().toISOString()
  }
]);

await supabase.from("produkte").update({ bestand: neuerBestand }).eq("id", product.id);
await supabase.from("users").update({ guthaben: neuesGuthaben }).eq("id", user.id);

setSubmitted(true);
setTimeout(() => {
  setSubmitted(false);
  setUser(null);
  setLoginName("");
  setPassword("");
  setProdukt("");
  setMenge("1");
}, 2000);
```

};

const handleAddProduct = async () => {
await supabase.from("produkte").insert(\[
{
name: newProductName,
preis: parseFloat(newProductPrice),
ek: parseFloat(newProductEK),
bestand: parseInt(newProductBestand)
}
]);
setNewProductName("");
setNewProductPrice("");
setNewProductEK("");
setNewProductBestand("");
};

const handleAddGuthaben = async () => {
const betrag = parseFloat(guthabenAufladen);
const neuesGuthaben = parseFloat(user.guthaben) + betrag;
await supabase.from("users").update({ guthaben: neuesGuthaben }).eq("id", user.id);
setUser({ ...user, guthaben: neuesGuthaben });
setGuthabenAufladen("");
};

if (!user) {
return ( <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4"> <Card className="w-full max-w-md shadow-2xl"> <CardContent className="space-y-6"> <h1 className="text-2xl font-bold text-center">Login: Rischis Kiosk</h1> <div> <Label>Dein Name</Label> <Select value={loginName} onValueChange={setLoginName}> <SelectTrigger> <SelectValue placeholder="Namen wählen..." /> </SelectTrigger> <SelectContent>
{users.map((u) => ( <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
))} </SelectContent> </Select> </div> <div> <Label>Passwort</Label>
\<Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /> </div>
{loginError && <div className="text-red-600 text-sm">{loginError}</div>} <Button onClick={handleLogin} className="w-full text-lg">Einloggen</Button> </CardContent> </Card> </div>
);
}

const isAdmin = user.is\_admin;

return ( <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4"> <Card className="w-full max-w-md shadow-2xl"> <CardContent className="space-y-6"> <h1 className="text-2xl font-bold text-center">Hallo, {user.name}!</h1> <p className="text-center">Guthaben: {parseFloat(user.guthaben).toFixed(2)} €</p>

```
      <div>
        <Label>Was hast du gekauft?</Label>
        <Select value={produkt} onValueChange={setProdukt}>
          <SelectTrigger>
            <SelectValue placeholder="Produkt wählen..." />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Wie viele Stück?</Label>
        <Input type="number" value={menge} min={1} max={10} onChange={(e) => setMenge(e.target.value)} />
      </div>

      <Button onClick={handleSubmit} className="w-full text-lg">Abschicken</Button>

      {submitted && <div className="text-center text-green-600 font-semibold">Eintrag erfolgreich gesendet!</div>}

      {isAdmin && (
        <div className="pt-8 border-t space-y-4">
          <h2 className="text-xl font-semibold">Neues Produkt hinzufügen</h2>
          <Input placeholder="Produktname" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} />
          <Input placeholder="Verkaufspreis" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} />
          <Input placeholder="Einkaufspreis" value={newProductEK} onChange={(e) => setNewProductEK(e.target.value)} />
          <Input placeholder="Bestand" value={newProductBestand} onChange={(e) => setNewProductBestand(e.target.value)} />
          <Button onClick={handleAddProduct} className="w-full">Produkt speichern</Button>

          <h3 className="text-xl pt-6 font-semibold">Guthaben aufladen</h3>
          <Input placeholder="Betrag in €" value={guthabenAufladen} onChange={(e) => setGuthabenAufladen(e.target.value)} />
          <Button onClick={handleAddGuthaben} className="w-full">Guthaben hinzufügen</Button>
        </div>
      )}
    </CardContent>
  </Card>
</div>
```

);
}
