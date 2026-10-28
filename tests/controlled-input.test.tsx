// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { describe, expect, it, vi } from "vitest";
import { ControlledInput } from "@/components/forms/controlled-input";

type Values = { nome: string };
const schema = yup.object({ nome: yup.string().required("Informe o nome.") });

function Harness({ onValid = vi.fn() }: { onValid?: (v: Values) => void }) {
  const methods = useForm<Values>({ resolver: yupResolver(schema), defaultValues: { nome: "" } });
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onValid)} noValidate>
        <ControlledInput<Values>
          name="nome"
          label="Nome"
          type="text"
          placeholder="Seu nome"
          description="Como quer ser chamado"
          autoComplete="name"
        />
        <button type="submit">Enviar</button>
      </form>
    </FormProvider>
  );
}

describe("ControlledInput", () => {
  it("recebe label, type, placeholder e atributos por props, com label associado", () => {
    render(<Harness />);
    const input = screen.getByLabelText("Nome");
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("placeholder", "Seu nome");
    expect(input).toHaveAttribute("autocomplete", "name");
    expect(input).toHaveAccessibleDescription("Como quer ser chamado");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("mostra o erro do schema, marca aria-invalid e associa a mensagem", async () => {
    const user = userEvent.setup();
    const onValid = vi.fn();
    render(<Harness onValid={onValid} />);
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    const input = screen.getByLabelText("Nome");
    expect(await screen.findByRole("alert")).toHaveTextContent("Informe o nome.");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(/Informe o nome\./);
    expect(onValid).not.toHaveBeenCalled();
  });

  it("envia o valor digitado quando válido", async () => {
    const user = userEvent.setup();
    const onValid = vi.fn();
    render(<Harness onValid={onValid} />);
    await user.type(screen.getByLabelText("Nome"), "Ana");
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    await vi.waitFor(() => expect(onValid).toHaveBeenCalledTimes(1));
    expect(onValid.mock.calls[0][0]).toEqual({ nome: "Ana" });
  });
});
