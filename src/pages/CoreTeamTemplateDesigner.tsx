import React from 'react';
import { Navigate } from 'react-router-dom';

const CoreTeamTemplateDesigner: React.FC = () => {
  return <Navigate to="/template-designer?templateKey=core-team&templateName=Core%20Team%20Template" replace />;
};

export default CoreTeamTemplateDesigner;
