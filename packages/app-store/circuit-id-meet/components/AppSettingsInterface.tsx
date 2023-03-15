import { useState } from "react";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { Button, TextField } from "@calcom/ui";

export default function AppSettings() {
  const { t } = useLocale();
  const [input, setInput] = useState("");

  return (
    <div className="space-y-4 px-4 pt-4 pb-4 text-sm">
      <TextField
        placeholder="Circuit ID Meet URL"
        value={input}
        name="Meeting URL"
        onChange={async (e) => {
          setInput(e.target.value);
        }}
      />
      <Button>{t("submit")}</Button>
    </div>
  );
}
