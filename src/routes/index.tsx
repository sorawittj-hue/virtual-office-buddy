import { createFileRoute } from "@tanstack/react-router";
import { Office } from "@/components/hermes/Office";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "เฮอร์มีส · ออฟฟิศเสมือน" },
      {
        name: "description",
        content:
          "ออฟฟิศเสมือนสุดน่ารัก ที่เฮอร์มีส พนักงาน AI ของคุณ คอยรับคำสั่งจากเจ้านายผ่าน Telegram",
      },
    ],
  }),
});

function Index() {
  return <Office />;
}
