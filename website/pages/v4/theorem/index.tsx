import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Layout from "../../../components/Layout";
import Spinner from "../../../components/Spinner";

const Shell: NextPage = () => {
  const router = useRouter();
  useEffect(() => {
    const name = window.location.pathname.split("/")[3];
    if (name) router.replace(`/v4/theorem/${name}`, undefined, { shallow: false });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <Layout version="v4"><div className="flex justify-center py-12"><Spinner size={10} /></div></Layout>;
};
export default Shell;
