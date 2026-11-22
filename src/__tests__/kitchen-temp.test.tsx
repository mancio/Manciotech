import {fireEvent, render, screen} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import KitchenTools from "../pages/KitchenTools";
import Temperature from "../pages/Temperature";

test("kitchen calculator recomputes water and hydration", () => {
    render(<MemoryRouter><KitchenTools/></MemoryRouter>);
    expect(screen.getByText("990 g")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Flour"), {target:{value:"500"}});
    fireEvent.click(screen.getByRole("button", {name:/Calculate water/}));
    expect(screen.getByLabelText("Water")).toHaveValue(325);
    expect(screen.getByText("825 g")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {name:/Reset to example/}));
    expect(screen.getByLabelText("Flour")).toHaveValue(600);
});

test("temperature page renders an explanation instead of crashing without Firebase configuration", () => {
    render(<MemoryRouter><Temperature/></MemoryRouter>);
    expect(screen.getByRole("heading", {name:"TempCasina."})).toBeInTheDocument();
    expect(screen.getByText("Sensor data unavailable")).toBeInTheDocument();
    expect(screen.getByText("No temperature reading available")).toBeInTheDocument();
});
