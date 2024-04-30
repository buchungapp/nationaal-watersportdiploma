"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@tremor/react";
import { useState } from "react";

const data = [
  {
    workspace: "sales_by_day_api",
    owner: "John Doe",
    status: "Live",
    costs: "$3,509.00",
    region: "US-West 1",
    capacity: "31.1%",
    lastEdited: "23/09/2023 13:00",
  },
  {
    workspace: "marketing_campaign",
    owner: "Jane Smith",
    status: "Live",
    costs: "$5,720.00",
    region: "US-East 2",
    capacity: "81.3%",
    lastEdited: "22/09/2023 10:45",
  },
  {
    workspace: "test_environment",
    owner: "David Clark",
    status: "Inactive",
    costs: "$800.00",
    region: "EU-Central 1",
    capacity: "40.8%",
    lastEdited: "25/09/2023 16:20",
  },
  {
    workspace: "sales_campaign",
    owner: "Jane Smith",
    status: "Downtime",
    costs: "$5,720.00",
    region: "US-East 2",
    capacity: "51.4%",
    lastEdited: "22/09/2023 10:45",
  },
  {
    workspace: "development_env",
    owner: "Mike Johnson",
    status: "Inactive",
    costs: "$4,200.00",
    region: "EU-West 1",
    capacity: "60.4%",
    lastEdited: "21/09/2023 14:30",
  },
  {
    workspace: "new_workspace_1",
    owner: "Alice Brown",
    status: "Inactive",
    costs: "$2,100.00",
    region: "US-West 2",
    capacity: "75.9%",
    lastEdited: "24/09/2023 09:15",
  },
];

export default function PersonsTable() {
  const [selectedStatus, setSelectedStatus] = useState([]);
  const isStatusSelected = (item) =>
    selectedStatus.includes(item.status) || selectedStatus.length === 0;
  return (
    <>
      <Table className="mt-8">
        <TableHead>
          <TableRow className="border-b border-tremor-border dark:border-dark-tremor-border">
            <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Workspace
            </TableHeaderCell>
            <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Owner
            </TableHeaderCell>
            <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Status
            </TableHeaderCell>
            <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Region
            </TableHeaderCell>
            <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Capacity
            </TableHeaderCell>
            <TableHeaderCell className="text-right text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Last edited
            </TableHeaderCell>
            <TableHeaderCell className="text-right text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Costs
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data
            .filter((item) => isStatusSelected(item))
            .map((item) => (
              <TableRow key={item.workspace}>
                <TableCell className="font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  {item.workspace}
                </TableCell>
                <TableCell>{item.owner}</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell>{item.region}</TableCell>
                <TableCell>{item.capacity}</TableCell>
                <TableCell className="text-right">{item.lastEdited}</TableCell>
                <TableCell className="text-right">{item.costs}</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </>
  );
}
