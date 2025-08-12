
import { Card, CardContent } from "@/components/ui/card";

interface DriverManagementProps {
  drivers: any[];
  onDriverUpdate: () => Promise<void>;
}

export const DriverManagement = ({ drivers, onDriverUpdate }: DriverManagementProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Driver Management</h2>
      {drivers.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No drivers registered yet</p>
          </CardContent>
        </Card>
      ) : (
        drivers.map((driver) => (
          <Card key={driver.id}>
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-900">{driver.full_name}</h3>
              <p className="text-sm text-gray-500">{driver.phone}</p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
