import { FC } from 'react';
import Icon from '@mui/icons-material/Update';

import CardWithIcon from './CardWithIcon';

interface Props {
    value?: string;
}

const TotalJobs: FC<Props> = ({ value }) => {
    return (
        <CardWithIcon
            to="/jobs"
            icon={Icon}
            title='Total Jobs'
            subtitle={value}
            color="#3182ce"
        />
    );
};

export default TotalJobs;
