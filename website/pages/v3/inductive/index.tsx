import { NextPage } from "next";
import { useEffect, useState } from "react";
import ClientItemPage from "../../../components/ClientItemPage";
import Layout from "../../../components/Layout";
import Spinner from "../../../components/Spinner";

const InductivePage: NextPage = () => {
  const [name, setName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const parts = window.location.pathname.split("/");
    if (parts.length >= 4 && parts[3]) {
      setName(decodeURIComponent(parts[3]));
    }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <Layout version="v3">
        <div className="flex justify-center py-12">
          <Spinner size={10} />
        </div>
      </Layout>
    );
  }

  if (!name) {
    return (
      <Layout version="v3">
        <h1 className="text-xl">Inductive not found</h1>
      </Layout>
    );
  }

  return <ClientItemPage version="v3" itemType="inductive" name={name} />;
};

export default InductivePage;
