import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1675272609415 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
    	    ('7e798714-1ae8-4ca7-baf3-7745dd1acc6f',61,'Bank',20061,'100 MILE HOUSE',70,'SERVICE BC                              ',74,'32H61',58200,1461,3200000,'Bank',' '),
    	    ('76cdf884-9bc8-49f4-bfcd-6360a5f4d26b',61,'Amex',20861,'100 MILE HOUSE AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32H61',58200,1461,3200000,'23591041',' '),
    	    ('ebef2b52-984a-4f2c-99ba-c3b580e0610a',61,'Debit',20261,'100 MILE HOUSE DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32H61',58200,1461,3200000,'22054353',' '),
    	    ('3bd1aada-e8c7-4051-a621-49c1ab55bf01',61,'Mastercard',20461,'100 MILE HOUSE MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32H61',58200,1461,3200000,'22054353',' '),
    	    ('582bfa91-920a-4d96-a434-157d6b9390dc',61,'Visa',20661,'100 MILE HOUSE-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32H61',58200,1461,3200000,'22054353',' '),
    	    ('e7556758-c0eb-48fd-aa26-e57778ae46d6',2,'Bank',20002,'ASHCROFT',70,'SERVICE BC                              ',74,'32G02',58200,1461,3200000,'Bank',' '),
    	    ('1c78f72f-6cef-4637-9827-46a8ae428c11',2,'Amex',20801,'ASHCROFT AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32G02',58200,1461,3200000,'23591066',' '),
    	    ('dc596449-4aef-4ae1-a41a-099ec673643a',2,'Debit',20202,'ASHCROFT DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32G02',58200,1461,3200000,'22054387',' '),
    	    ('5fe89bbf-8be8-4d23-9e87-ef4be756dba2',2,'Mastercard',20201,'ASHCROFT MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32G02',58200,1461,3200000,'22054387',' '),
    	    ('635f7c4c-bd8d-4b90-909b-4b749b30ca4e',2,'Visa',20602,'ASHCROFT-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32G02',58200,1461,3200000,'22054387',' ');
            `);

    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('224dbfa2-63f9-45dc-90a3-586c39148433',3,'Bank',20003,'ATLIN',70,'SERVICE BC                              ',74,'32J03',58200,1461,3200000,'Bank',' '),
	        ('70564177-f01c-4780-8d4c-f20b3fa8d229',3,'Amex',20803,'ATLIN AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32J03',58200,1461,3200000,'23591074',' '),
	        ('4ea42807-cdc2-43dc-8012-59f1f6b4e67e',3,'Mastercard',20403,'ATLIN MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32J03',58200,1461,3200000,'22054486',' '),
	        ('2b6a375b-5406-45ad-b14f-f22c54222fda',3,'Debit',20203,'ATLIN-DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32J03',58200,1461,3200000,'22054486',' '),
	        ('0840035d-1d8f-4229-af85-abb82d47338a',3,'Visa',20603,'ATLIN-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32J03',58200,1461,3200000,'22054486',' '),
	        ('6fd9160f-c289-48b0-8537-5462f45fa9ff',8,'Bank',20008,'BELLA COOLA',70,'SERVICE BC                              ',74,'32H08',58200,1461,3200000,'Bank',' '),
	        ('822da0fa-57c2-4ae4-97ad-6e5b1683fcfa',8,'Amex',20808,'BELLA COOLA AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32H08',58200,1461,3200000,'23591082',' '),
	        ('654a5b31-afda-4ba1-a8d4-767861245a75',8,'Debit',20208,'BELLA COOLA DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32H08',58200,1461,3200000,'22054577',' '),
	        ('b1b27db2-16d3-461c-9627-fa3c7d0e7088',8,'Mastercard',20408,'BELLA COOLA MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32H08',58200,1461,3200000,'22054577',' '),
	        ('bd0a84fa-946d-4454-9e93-c0dcdec68cd7',8,'Visa',20608,'BELLA COOLA-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32H08',58200,1461,3200000,'22054577',' ');
               `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('94be5e7d-8d23-41ce-ae3f-1dfd9f105b0d',10,'Amex',20303,'BURNABY AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32L10',58200,1461,3200000,'28624979',' '),
	        ('187cd8d7-b6be-4ca4-b282-4daa698149be',10,'Debit',20304,'BURNABY DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32L10',58200,1461,3200000,'23684779',' '),
	        ('59d62732-c680-4038-8e3f-17992395dda6',10,'Mastercard',20302,'BURNABY MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32L10',58200,1461,3200000,'23684779',' '),
	        ('513081cb-e4e5-4053-b6e7-d15d36b22aba',10,'Visa',20301,'BURNABY-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32L10',58200,1461,3200000,'23684779',' '),
	        ('e85ead91-f55e-427e-b4ea-1f06e24db430',11,'Bank',20011,'BURNS LAKE',70,'SERVICE BC                              ',74,'32J11',58200,1461,3200000,'Bank',' '),
	        ('9b7220f0-e419-4b60-80a3-839964e8754c',11,'Amex',20811,'BURNS LAKE AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32J11',58200,1461,3200000,'23591090',' '),
	        ('1d829919-4f10-451e-8481-97c616ca0e38',11,'Debit',20211,'BURNS LAKE DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32J11',58200,1461,3200000,'22042705',' '),
	        ('11b076b7-c1bd-4e85-813f-9efdcf43978e',11,'Mastercard',20411,'BURNS LAKE MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32J11',58200,1461,3200000,'22042705',' '),
	        ('cbb7ba46-8cd0-40f1-91cd-cc76a9e31753',11,'Visa',20611,'BURNS LAKE-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32J11',58200,1461,3200000,'22042705',' '),
	        ('4950d134-b3a1-4a78-b011-c67c55b2fc72',12,'Bank',20012,'CAMPBELL RIVER',70,'SERVICE BC                              ',74,'32L12',58200,1461,3200000,'Bank',' ');
               `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('3e00f9a8-abf4-4347-bd3e-8e9fa9597fd4',12,'Amex',20812,'CAMPBELL RIVER AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32L12',58200,1461,3200000,'23591116',' '),
	        ('3722b3af-80f4-4e9d-a9ba-bbe8d7161076',12,'Mastercard',20412,'CAMPBELL RIVER MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32L12',58200,1461,3200000,'22042747',' '),
	        ('57c31793-cafc-41cf-b55c-792a112c0410',12,'Debit',20212,'CAMPBELL RIVER-DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32L12',58200,1461,3200000,'22042747',' '),
	        ('e1dda665-3d86-4641-908a-5f7b8131e692',12,'Visa',20612,'CAMPBELL RIVER-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32L12',58200,1461,3200000,'22042747',' '),
	        ('a0bf9c37-95f8-4190-bcb8-80223d9cf25e',19,'Visa',20619,'CHETWTND-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32H19',58200,1461,3200000,'22042754',' '),
	        ('cc3b45f4-cf6b-4a51-b339-a7f2099f388a',19,'Bank',20009,'CHETWYND',70,'SERVICE BC                              ',74,'32H19',58200,1461,3200000,'Bank',' '),
	        ('aa0b89c0-c740-45c5-ba26-7149cb8343d3',19,'Bank',20019,'CHETWYND',70,'SERVICE BC                              ',74,'32H19',58200,1461,3200000,'Bank',' '),
	        ('c972d0f5-fe13-4049-ab92-bc5c93acc396',19,'Amex',20819,'CHETWYND AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32H19',58200,1461,3200000,'23591124',' '),
	        ('728215ab-66c9-4816-ae22-6f2f82c9c608',19,'Debit',20219,'CHETWYND DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32H19',58200,1461,3200000,'22042754',' '),
	        ('3fde602f-64c5-4aaf-a843-2358d41d724d',19,'Mastercard',20419,'CHETWYND MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32H19',58200,1461,3200000,'22042754',' ');
               `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	         ('6e0c083c-586b-4841-9b40-280cbc7e3a5c',14,'Bank',20014,'CHILLIWACK',70,'SERVICE BC                              ',74,'32L14',58200,1461,3200000,'Bank',' '),
	         ('bbcb0ab6-c90a-449f-96b6-5fc25e86311d',14,'Amex',20814,'CHILLIWACK AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32L14',58200,1461,3200000,'23591132',' '),
	         ('4f15cc8d-bae7-42aa-9c4f-7cfc0e941196',14,'Debit',20214,'CHILLIWACK DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32L14',58200,1461,3200000,'22042796',' '),
	         ('ce0611bc-469a-4dca-b3f6-9d6b5ef2b41a',14,'Mastercard',20414,'CHILLIWACK MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32L14',58200,1461,3200000,'22042796',' '),
	         ('71dc39f6-1be6-49b1-9de6-5a4da7cdb871',14,'Visa',20614,'CHILLIWACK-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32L14',58200,1461,3200000,'22042796',' '),
	         ('ea98d30d-1ec9-4678-9499-685855a3deb3',15,'Bank',20015,'CLINTON',70,'SERVICE BC                              ',74,'32G15',58200,1461,3200000,'Bank',' '),
	         ('9ff02638-47a3-4a0f-9967-7198f09090d0',15,'Amex',20815,'CLINTON AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32G15',58200,1461,3200000,'23591157',' '),
	         ('c9ab665b-4ea6-4291-bd31-0739c6742dd7',15,'Debit',20215,'CLINTON DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32G15',58200,1461,3200000,'22042820',' '),
	         ('ee69dacc-37bb-4290-b92e-8543e55c8e79',15,'Mastercard',20415,'CLINTON MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32G15',58200,1461,3200000,'22042820',' '),
	         ('5ad031f8-7a73-48f6-bbb6-ba307d5c7d0b',15,'Visa',20615,'CLINTON-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32G15',58200,1461,3200000,'22042820',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('cbaa5127-a372-419c-84dc-64e6fff561d6',16,'Bank',20016,'COURTENAY',70,'SERVICE BC                              ',74,'32L16',58200,1461,3200000,'Bank',' '),
	        ('26898a85-7a73-4da4-a85b-48b421546929',16,'Amex',20816,'COURTENAY AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32L16',58200,1461,3200000,'23591173',' '),
	        ('1584f87f-896a-4090-a88f-158c5a812208',16,'Debit',20216,'COURTENAY DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32L16',58200,1461,3200000,'22042838',' '),
	        ('f75a8677-5576-4154-a6a8-37451b4f0349',16,'Mastercard',20416,'COURTENAY MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32L16',58200,1461,3200000,'22042838',' '),
	        ('be11571f-7791-4eb5-8378-16bb121b5db6',16,'Visa',20616,'COURTENAY-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32L16',58200,1461,3200000,'22042838',' '),
	        ('35c861ab-8e5e-4880-b410-f2ab130a09e4',17,'Bank',20017,'CRANBROOK',70,'SERVICE BC                              ',74,'32F17',58200,1461,3200000,'Bank',' '),
	        ('a02aa538-0aa7-4d60-bfd6-a8f0154d66a1',17,'Amex',20817,'CRANBROOK AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32F17',58200,1461,3200000,'23591199',' '),
	        ('335adfcb-a42b-4140-a86d-eec4ce9562a9',17,'Debit',20217,'CRANBROOK DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32F17',58200,1461,3200000,'22042887',' '),
	        ('a8a7a8b9-3728-4b93-bd75-3b97ca63f128',17,'Mastercard',20417,'CRANBROOK MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32F17',58200,1461,3200000,'22042887',' '),
	        ('b6247de3-f535-43e6-a254-68269906e19b',17,'Visa',20617,'CRANBROOK-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32F17',58200,1461,3200000,'22042887',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('28477803-7662-4a75-85b1-425e287df33e',18,'Bank',20018,'CRESTON',70,'SERVICE BC                              ',74,'32F18',58200,1461,3200000,'Bank',' '),
	        ('6d396b48-1c42-47b8-9856-a915371394a1',18,'Amex',20818,'CRESTON AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32F18',58200,1461,3200000,'23591207',' '),
	        ('182db513-8146-43eb-ae35-9daffbb323f5',18,'Debit',20218,'CRESTON DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32F18',58200,1461,3200000,'22043067',' '),
	        ('618a0aaf-a16d-4f09-8378-4b3939626c77',18,'Mastercard',20418,'CRESTON MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32F18',58200,1461,3200000,'22043067',' '),
	        ('30573a3e-3f28-4552-a125-387e4e52febb',18,'Visa',20618,'CRESTON-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32F18',58200,1461,3200000,'22043067',' '),
	        ('183e212d-2e92-49fe-aac8-94af9cfdb021',23,'Bank',20023,'DAWSON CREEK',70,'SERVICE BC                              ',74,'32H23',58200,1461,3200000,'Bank',' '),
	        ('56a4a592-d0d9-45c4-9b4b-63097b6ee209',23,'Amex',20823,'DAWSON CREEK AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32H23',58200,1461,3200000,'23591363',' '),
	        ('98738e4a-0d6d-42f1-9564-630896d3840d',23,'Debit',20223,'DAWSON CREEK DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32H23',58200,1461,3200000,'22043083',' '),
	        ('2cc34ba7-3f0a-4d75-8788-a85db8b449f7',23,'Mastercard',20423,'DAWSON CREEK MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32H23',58200,1461,3200000,'22043083',' '),
	        ('bfd3dd61-a8a5-4f51-8f04-f06a561c6232',23,'Visa',20623,'DAWSON CREEK-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32H23',58200,1461,3200000,'22043083',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('452932e8-ea43-41c1-a414-6a90e6c6b4d4',13,'Bank',20013,'DEASE LAKE',70,'SERVICE BC                              ',74,'32J13',58200,1461,3200000,'Bank',' '),
	        ('1ce5c111-869a-4257-8062-b5a1b2d5b9b7',13,'Amex',20813,'DEASE LAKE AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32J13',58200,1461,3200000,'23591371',' '),
	        ('fdf8f28e-5cab-4592-baa9-ad58f3618155',13,'Debit',20213,'DEASE LAKE DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32J13',58200,1461,3200000,'22043141',' '),
	        ('895178c1-f3da-4818-aa30-74ffee58e784',13,'Mastercard',20413,'DEASE LAKE MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32J13',58200,1461,3200000,'22043141',' '),
	        ('08b85e74-110a-4fd4-9508-da1d45dbf171',13,'Visa',20613,'DEASE LAKE-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32J13',58200,1461,3200000,'22043141',' '),
	        ('0d27add0-1365-47d0-8bea-d87a36bdb754',25,'Bank',20025,'DUNCAN',70,'SERVICE BC                              ',74,'32L25',58200,1461,3200000,'Bank',' '),
	        ('52374b58-83e3-4e87-94e3-c08c2c6a1897',25,'Amex',20825,'DUNCAN AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32L25',58200,1461,3200000,'23591389',' '),
	        ('ad7f3815-611e-44ec-bf92-7f89f404800b',25,'Debit',20225,'DUNCAN DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32L25',58200,1461,3200000,'22043182',' '),
	        ('fd71b2c6-e21c-4f38-a254-6d72901ead32',25,'Mastercard',20425,'DUNCAN MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32L25',58200,1461,3200000,'22043182',' '),
	        ('fe876e04-312c-42a8-82cd-ccb61421f047',25,'Visa',20625,'DUNCAN-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32L25',58200,1461,3200000,'22043182',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('50854bc4-a490-4550-95f4-a9c4f33e0b10',30,'Bank',20030,'FERNIE',70,'SERVICE BC                              ',74,'32F30',58200,1461,3200000,'Bank',' '),
	        ('7009df06-acb4-4ac2-aab6-8a7096988f4b',30,'Amex',20830,'FERNIE AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32F30',58200,1461,3200000,'23591397',' '),
	        ('56383ee7-ab79-42ae-8094-3b9077ef81a2',30,'Debit',20230,'FERNIE DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32F30',58200,1461,3200000,'22043208',' '),
	        ('79845507-55bb-4099-bc64-01eba79b0938',30,'Mastercard',20430,'FERNIE MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32F30',58200,1461,3200000,'22043208',' '),
	        ('3ac61c6f-9587-4951-99e8-0a7789458aa4',30,'Visa',20630,'FERNIE-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32F30',58200,1461,3200000,'22043208',' '),
	        ('884ae0bc-8c4a-440f-8790-27e151a5164a',32,'Bank',20032,'FORT NELSON',70,'SERVICE BC                              ',74,'32H32',58200,1461,3200000,'Bank',' '),
	        ('fa132098-44e4-49e2-8d58-f5c3923a0876',32,'Amex',20832,'FORT NELSON AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32H32',58200,1461,3200000,'23591413',' '),
	        ('e3835b06-c4be-4868-b0ec-3ed53584da02',32,'Debit',20232,'FORT NELSON DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32H32',58200,1461,3200000,'22043281',' '),
	        ('4bd37306-bc4b-43fc-9479-69d6644e5c05',32,'Mastercard',20432,'FORT NELSON MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32H32',58200,1461,3200000,'22043281',' '),
	        ('00456328-f043-4c4a-89f1-b24c8080e03d',32,'Visa',20632,'FORT NELSON-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32H32',58200,1461,3200000,'22043281',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('88163689-362d-4dc9-b9b6-69651892bb2d',33,'Bank',20033,'FORT ST. JAMES',70,'SERVICE BC                              ',74,'32H33',58200,1461,3200000,'Bank',' '),
	        ('b50c8bcc-52e1-4e8f-bc3c-64a19f88f3e5',33,'Amex',20833,'FORT ST. JAMES AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32H33',58200,1461,3200000,'23591587',' '),
	        ('f56dbece-f16e-4e50-9488-ef0b280d7d09',33,'Debit',20233,'FORT ST. JAMES DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32H33',58200,1461,3200000,'22043315',' '),
	        ('35f6427c-6102-41fc-a634-e09fb81a7ff3',33,'Mastercard',20433,'FORT ST. JAMES MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32H33',58200,1461,3200000,'22043315',' '),
	        ('d0d17808-0371-4485-b688-1d22afe91cca',33,'Visa',20633,'FORT ST. JAMES-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32H33',58200,1461,3200000,'22043315',' '),
	        ('7c5aebaf-cc0a-4aca-a7ce-a38925017291',31,'Bank',20031,'FORT ST. JOHN',70,'SERVICE BC                              ',74,'32H31',58200,1461,3200000,'Bank',' '),
	        ('4dc0ed2d-0e70-4dab-ba8f-a4eabb272932',31,'Amex',20831,'FORT ST. JOHN AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32H31',58200,1461,3200000,'23591595',' '),
	        ('ac34ff45-924b-4cf8-8529-ee75b6cc77b2',31,'Debit',20231,'FORT ST. JOHN DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32H31',58200,1461,3200000,'22043372',' '),
	        ('a7550898-e7bc-4f14-b4b9-5f7c6128f0ad',31,'Mastercard',20431,'FORT ST. JOHN MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32H31',58200,1461,3200000,'22043372',' '),
	        ('aeceb7d9-61ec-4ce7-b692-cbd4dc029198',31,'Visa',20631,'FORT ST. JOHN-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32H31',58200,1461,3200000,'22043372',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('858e3d0e-02c4-4938-9b6a-c4419e2878c1',37,'Bank',20037,'GANGES',70,'SERVICE BC                              ',74,'32L37',58200,1461,3200000,'Bank',' '),
	        ('eceacf8f-b6c6-45c4-9a48-2aa92542e698',37,'Amex',20837,'GANGES AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32L37',58200,1461,3200000,'23591603',' '),
	        ('5a04fb32-0c77-41a2-87eb-1ff449f473d8',37,'Debit',20237,'GANGES DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32L37',58200,1461,3200000,'22043380',' '),
	        ('cebf0331-307d-4800-a256-303ae46832fc',37,'Mastercard',20437,'GANGES MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32L37',58200,1461,3200000,'22043380',' '),
	        ('d24c100d-0ced-48da-ae64-5e2f42e3a721',37,'Visa',20637,'GANGES-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32L37',58200,1461,3200000,'22043380',' '),
	        ('52f1905b-7b83-438f-9de8-e2e5ad479244',35,'Bank',20035,'GOLDEN',70,'SERVICE BC                              ',74,'32F35',58200,1461,3200000,'Bank',' '),
	        ('e1cce041-db7d-4363-8686-409b72882a6a',35,'Amex',20835,'GOLDEN AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32F35',58200,1461,3200000,'23591629',' '),
	        ('dd36a749-2c62-458a-b863-61ac43bc256e',35,'Debit',20235,'GOLDEN DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32F35',58200,1461,3200000,'22043406',' '),
	        ('0c663738-4773-4b06-bc46-c54102d589cb',35,'Mastercard',20435,'GOLDEN MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32F35',58200,1461,3200000,'22043406',' '),
	        ('f569d334-abe7-40b4-b8f3-4f021be033ca',35,'Visa',20635,'GOLDEN-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32F35',58200,1461,3200000,'22043406',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('208377bf-d2c0-4a54-8580-d170ff30f111',36,'Bank',20036,'GRAND FORKS',70,'SERVICE BC                              ',74,'32F36',58200,1461,3200000,'Bank',' '),
	        ('70f24b8f-d988-44aa-b251-b77def163530',36,'Amex',20836,'GRAND FORKS AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32F36',58200,1461,3200000,'23591637',' '),
	        ('74ef5f65-1cb3-413a-9e7e-e9b5db7e14d0',36,'Debit',20236,'GRAND FORKS DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32F36',58200,1461,3200000,'22043430',' '),
	        ('b25b6145-c8c0-40bd-9cbe-9497ac670cf2',36,'Mastercard',20436,'GRAND FORKS MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32F36',58200,1461,3200000,'22043430',' '),
	        ('fb0e88c2-c2ac-4bc5-9898-7446c91e5e10',36,'Visa',20636,'GRAND FORKS-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32F36',58200,1461,3200000,'22043430',' '),
	        ('5d70eb02-3db6-4634-9b8a-120d1ffbae0e',1,'Bank',20100,'HAZELTON',70,'SERVICE BC                              ',74,'32J01',58200,1461,3200000,'Bank',' '),
	        ('eac5217e-a017-4d4e-a418-bb46dd2debce',1,'Amex',20800,'HAZELTON AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32J01',58200,1461,3200000,'23591645',' '),
	        ('fc81fd04-ea05-46d0-8532-7ac19d9b1cb8',1,'Debit',20300,'HAZELTON DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32J01',58200,1461,3200000,'22043448',' '),
	        ('fd831098-1608-4804-ba20-37fc7c75ee03',1,'Mastercard',20500,'HAZELTON MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32J01',58200,1461,3200000,'22043448',' '),
	        ('9dd663ce-d2ef-45d0-9b0d-a8ff69a0cf11',1,'Visa',20700,'HAZELTON-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32J01',58200,1461,3200000,'22043448',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('a595f80c-5610-41b1-a074-3231379f84e8',39,'Bank',20039,'HOUSTON',70,'SERVICE BC                              ',74,'32J39',58200,1461,3200000,'Bank',' '),
	        ('bcdf7be2-acf7-453b-98a0-398d9b2798a6',39,'Amex',20839,'HOUSTON AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32J39',58200,1461,3200000,'23591660',' '),
	        ('45ff9c0c-07d5-4141-aff5-870e6b06b341',39,'Debit',20239,'HOUSTON DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32J39',58200,1461,3200000,'22043463',' '),
	        ('fd6d917d-ad07-4f79-8472-fc5786a40b53',39,'Mastercard',20439,'HOUSTON MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32J39',58200,1461,3200000,'22043463',' '),
	        ('40e48cfb-b49a-49e5-aebd-c1eff5268354',39,'Visa',20639,'HOUSTON-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32J39',58200,1461,3200000,'22043463',' '),
	        ('e7c276a5-6c26-41c1-8fa8-41c795a53bdd',38,'Bank',20038,'INVERMERE',70,'SERVICE BC                              ',74,'32F38',58200,1461,3200000,'Bank',' '),
	        ('d286e4ae-3d69-40bd-9872-547266549a4c',38,'Amex',20838,'INVERMERE AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32F38',58200,1461,3200000,'23591835',' '),
	        ('a4573e35-9abd-4e78-87ff-73f3e6325c08',38,'Debit',20238,'INVERMERE DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32F38',58200,1461,3200000,'22043505',' '),
	        ('e2086c08-1393-44c7-9937-89cc7f4bb8da',38,'Mastercard',20438,'INVERMERE MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32F38',58200,1461,3200000,'22043505',' '),
	        ('aea72d55-2e83-4391-9fec-95d7726da067',38,'Visa',20638,'INVERMERE-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32F38',58200,1461,3200000,'22043505',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('f9c8cf9b-b1ef-471d-b5b3-1ad787da1499',40,'Bank',20040,'KAMLOOPS',70,'SERVICE BC                              ',74,'32G40',58200,1461,3200000,'Bank',' '),
	        ('34070cda-442a-4420-aa78-d7e377211b27',40,'Amex',20840,'KAMLOOPS AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32G40',58200,1461,3200000,'23592072',' '),
	        ('a91e9cac-b07c-4ec3-80b1-0c258792b004',40,'Debit',20240,'KAMLOOPS DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32G40',58200,1461,3200000,'22043539',' '),
	        ('4440e56b-7f88-4dd3-8034-13d2086dccf5',40,'Mastercard',20440,'KAMLOOPS MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32G40',58200,1461,3200000,'22043539',' '),
	        ('850647ba-1ae6-447c-b647-d66113e00047',40,'Visa',20640,'KAMLOOPS-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32G40',58200,1461,3200000,'22043539',' '),
	        ('ec834558-ff75-4351-b7d7-3adabfd81bfd',41,'Bank',20041,'KASLO',70,'SERVICE BC                              ',74,'32F41',58200,1461,3200000,'Bank',' '),
	        ('40872025-9c94-4bba-8388-70346f46ea43',41,'Amex',20841,'KASLO AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32F41',58200,1461,3200000,'23592098',' '),
	        ('cfb270ce-a543-466e-ad0a-6e80f7c7ceb5',41,'Debit',20241,'KASLO DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32F41',58200,1461,3200000,'22043547',' '),
	        ('acbe1c30-a51a-4382-90e2-6ee11a9df30b',41,'Mastercard',20441,'KASLO MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32F41',58200,1461,3200000,'22043547',' '),
	        ('4ea0d97c-d935-4bb8-acc9-80481a97e034',41,'Visa',20641,'KASLO-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32F41',58200,1461,3200000,'22043547',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('a0721dcb-982f-4638-9119-e18a3c94ba91',42,'Bank',20042,'KELOWNA',70,'SERVICE BC                              ',74,'32G42',58200,1461,3200000,'Bank',' '),
	        ('74db05c8-e6aa-4250-95e0-65b3256682b8',42,'Amex',20842,'KELOWNA AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32G42',58200,1461,3200000,'23592114',' '),
	        ('0a80df3a-d140-4e71-8807-11b9130e8710',42,'Debit',20242,'KELOWNA DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32G42',58200,1461,3200000,'22455675',' '),
	        ('a8a0e6ab-80d2-4645-ac33-c2972a0bb33a',42,'Mastercard',20442,'KELOWNA M/C POS',315,'SERVICE BC M/C POS                      ',74,'32G42',58200,1461,3200000,'22455675',' '),
	        ('5408ab79-abca-47e3-afec-18e4b5d3fc47',42,'Visa',20642,'KELOWNA VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32G42',58200,1461,3200000,'22455675',' '),
	        ('6ac5881d-ea5f-485f-9b5c-e1e03ec72b61',43,'Bank',20043,'KITIMAT',70,'SERVICE BC                              ',74,'32J43',58200,1461,3200000,'Bank',' '),
	        ('cc826618-ba01-4ed2-a1ed-d207d34e38fa',43,'Amex',20843,'KITIMAT AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32J43',58200,1461,3200000,'23592122',' '),
	        ('7a66f867-fb52-407a-aa58-2b3ec6ecffcd',43,'Debit',20243,'KITIMAT DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32J43',58200,1461,3200000,'22043562',' '),
	        ('462fe7a1-9264-4631-be54-eccea41f439d',43,'Mastercard',20443,'KITIMAT MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32J43',58200,1461,3200000,'22043562',' '),
	        ('2ed46b7b-26f6-4dcf-981f-6e553f697580',43,'Visa',20643,'KITIMAT-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32J43',58200,1461,3200000,'22043562',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('82462de4-c2fc-4d37-9a45-e2e83c1c2ce9',45,'Bank',20045,'LILLOOET',70,'SERVICE BC                              ',74,'32G45',58200,1461,3200000,'Bank',' '),
	        ('56e93629-5f46-426d-8b7e-226c0dea0369',45,'Amex',20845,'LILLOOET AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32G45',58200,1461,3200000,'23592155',' '),
	        ('aa7ada40-65ac-4f63-9ed3-2c3f87e916d7',45,'Debit',20245,'LILLOOET DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32G45',58200,1461,3200000,'22043596',' '),
	        ('34ea39f5-94a9-442b-af3b-bba55c87a5e5',45,'Mastercard',20445,'LILLOOET MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32G45',58200,1461,3200000,'22043596',' '),
	        ('13e516c4-beac-4f6d-939e-9c77599349fa',45,'Visa',20645,'LILLOOET-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32G45',58200,1461,3200000,'22043596',' '),
	        ('a2e17f0c-027f-4eb8-9cdf-c535b0575c70',47,'Bank',20047,'MACKENZIE',70,'SERVICE BC                              ',74,'32H47',58200,1461,3200000,'Bank',' '),
	        ('39eece32-fa12-4356-a682-8bebd829d294',47,'Amex',20847,'MACKENZIE AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32H47',58200,1461,3200000,'23592189',' '),
	        ('887fab1e-880e-455c-862e-0985bb0c8614',47,'Debit',20247,'MACKENZIE DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32H47',58200,1461,3200000,'22043604',' '),
	        ('f104bb77-57ae-4cfd-afc0-037fd4a74e5d',47,'Mastercard',20447,'MACKENZIE MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32H47',58200,1461,3200000,'22043604',' '),
	        ('88f1e9dc-3f8c-4844-a903-e50a1c0f691d',47,'Visa',20647,'MACKENZIE-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32H47',58200,1461,3200000,'22043604',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('dff0356b-2a2d-412a-93aa-4cfaccc38047',46,'Bank',20046,'MAPLE RIDGE',70,'SERVICE BC                              ',74,'32L46',58200,1461,3200000,'Bank',' '),
	        ('bfdcb9c8-676d-44e9-9571-512128cce8d9',46,'Amex',20846,'MAPLE RIDGE AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32L46',58200,1461,3200000,'23592205',' '),
	        ('feb4d5dd-fa3b-492f-b0eb-a839fecd77a8',46,'Debit',20246,'MAPLE RIDGE DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32L46',58200,1461,3200000,'22043620',' '),
	        ('e322a78a-cbb7-47d0-9948-4a96fa1fb32b',46,'Mastercard',20446,'MAPLE RIDGE MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32L46',58200,1461,3200000,'22043620',' '),
	        ('9981adb7-ab25-459e-aad1-aa28198c6558',46,'Visa',20646,'MAPLE RIDGE-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32L46',58200,1461,3200000,'22043620',' '),
	        ('b5afa00c-1328-42a4-94f2-84229d4d0ece',48,'Bank',20048,'MASSET',70,'SERVICE BC                              ',74,'32J48',58200,1461,3200000,'Bank',' '),
	        ('3c065f42-c04d-41f4-b4f0-2dcd7675b206',48,'Amex',20848,'MASSET AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32J48',58200,1461,3200000,'23592247',' '),
	        ('291f6a79-fed0-4d71-bdf3-8e2ed40200d9',48,'Debit',20248,'MASSET DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32J48',58200,1461,3200000,'20803999',' '),
	        ('c0afe69d-c749-426e-9bf3-2db5bcdcbe36',48,'Mastercard',20448,'MASSET MSTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32J48',58200,1461,3200000,'20803999',' '),
	        ('1d39acf2-fa98-4e09-b155-46d726a883ac',48,'Visa',20648,'MASSET VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32J48',58200,1461,3200000,'20803999',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('7cd66c26-ff64-4455-82df-a135756265b8',50,'Bank',20050,'MERRITT',70,'SERVICE BC                              ',74,'32G50',58200,1461,3200000,'Bank',' '),
	        ('d1cb005a-4f7b-4f6e-bc2b-983d8709acfd',50,'Amex',20850,'MERRITT AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32G50',58200,1461,3200000,'23592262',' '),
	        ('ccb6031d-e66c-411b-96ad-b04d604d5772',50,'Debit',20250,'MERRITT DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32G50',58200,1461,3200000,'22043646',' '),
	        ('3e06a460-8dd8-4881-ab94-92673bd6454b',50,'Mastercard',20450,'MERRITT MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32G50',58200,1461,3200000,'22043646',' '),
	        ('f2a0c075-e0ed-4e51-9ccf-7c5598cd16fb',50,'Visa',20650,'MERRITT-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32G50',58200,1461,3200000,'22043646',' '),
	        ('2991153b-06d0-46a6-a176-0c0b1d44039c',51,'Bank',20051,'NAKUSP',70,'SERVICE BC                              ',74,'32F51',58200,1461,3200000,'Bank',' '),
	        ('2236729a-2625-4e4d-af97-377956d57230',51,'Amex',20851,'NAKUSP AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32F51',58200,1461,3200000,'23592270',' '),
	        ('1bb86665-2eeb-4de6-aa1e-bd6b34bbf63f',51,'Debit',20251,'NAKUSP DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32F51',58200,1461,3200000,'22043653',' '),
	        ('4d38f1d2-d1be-4711-a039-94cd1dc21d28',51,'Mastercard',20451,'NAKUSP MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32F51',58200,1461,3200000,'22043653',' '),
	        ('b7e1dd52-e6e2-4fef-a228-2b5bf3c8a5a6',51,'Visa',20651,'NAKUSP-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32F51',58200,1461,3200000,'22043653',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('8ea45c4b-48d4-4aa3-bd72-1dfa7db556d1',55,'Bank',20055,'NANAIMO',70,'SERVICE BC                              ',74,'32L55',58200,1461,3200000,'Bank',' '),
	        ('1d307d94-cf73-42c5-b9ae-2ba5e2df9bd5',55,'Amex',20855,'NANAIMO AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32L55',58200,1461,3200000,'23592288',' '),
	        ('8a2ba378-b03d-4f8e-8eb3-4dfe18d1f791',55,'Debit',20255,'NANAIMO DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32L55',58200,1461,3200000,'22043661',' '),
	        ('25e65ba3-9d4f-45f2-8337-b9e78e264158',55,'Mastercard',20455,'NANAIMO MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32L55',58200,1461,3200000,'22043661',' '),
	        ('93b3ce1d-b8d1-4d75-988b-9698b834ebd1',55,'Visa',20655,'NANAIMO-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32L55',58200,1461,3200000,'22043661',' '),
	        ('3b36d4c6-9ce4-43c1-81f4-0f8a4c2d8210',56,'Bank',20056,'NELSON',70,'SERVICE BC                              ',74,'32F56',58200,1461,3200000,'Bank',' '),
	        ('ac0f9ad4-ee0a-464c-851b-1baf365178cb',56,'Amex',20856,'NELSON AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32F56',58200,1461,3200000,'23592296',' '),
	        ('3985c140-316c-460a-9a9f-5c94634b7f94',56,'Debit',20256,'NELSON DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32F56',58200,1461,3200000,'22043679',' '),
	        ('888b1de7-f014-46d1-8b69-52005589c7a8',56,'Mastercard',20456,'NELSON MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32F56',58200,1461,3200000,'22043679',' '),
	        ('80318d32-b7d1-485a-9b60-05a81d37beb2',56,'Visa',20656,'NELSON-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32F56',58200,1461,3200000,'22043679',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('8cdf509c-1e7b-4908-81e5-81c669931cf1',60,'Bank',20060,'OLIVER',70,'SERVICE BC                              ',74,'32G60',58200,1461,3200000,'Bank',' '),
	        ('8d31515c-c118-4601-bf15-19c668ed90e1',60,'Amex',20860,'OLIVER AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32G60',58200,1461,3200000,'23592304',' '),
	        ('f43bcb28-fa80-4cbf-b859-6f2e38959bc4',60,'Debit',20260,'OLIVER DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32G60',58200,1461,3200000,'22043703',' '),
	        ('66c3742c-9940-4bcc-ab46-0f820113a0f7',60,'Mastercard',20460,'OLIVER MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32G60',58200,1461,3200000,'22043703',' '),
	        ('45f299b3-93c0-40e5-9251-9cfeea8b089d',60,'Visa',20660,'OLIVER-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32G60',58200,1461,3200000,'22043703',' '),
	        ('2059cfd3-9c58-4554-89aa-a380f49be7b6',65,'Bank',20065,'PENTICTON',70,'SERVICE BC                              ',74,'32G65',58200,1461,3200000,'Bank',' '),
	        ('01418809-e517-43dc-8860-e250738cdc1a',65,'Amex',20865,'PENTICTON AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32G65',58200,1461,3200000,'23592312',' '),
	        ('76316135-2cd4-4ba5-93d3-f2991a7630c5',65,'Debit',20265,'PENTICTON DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32G65',58200,1461,3200000,'22043745',' '),
	        ('de15fc9c-b981-4c8b-85b7-e9fed019e677',65,'Mastercard',20465,'PENTICTON MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32G65',58200,1461,3200000,'22043745',' '),
	        ('739ccd94-8711-4d06-ad93-bb942b3c3751',65,'Visa',20665,'PENTICTON-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32G65',58200,1461,3200000,'22043745',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('cc539c50-306c-44d4-ab05-930eef1fbb62',66,'Bank',20010,'PORT ALBERNI',70,'SERVICE BC                              ',74,'32L66',58200,1461,3200000,'Bank',' '),
	        ('b2d4e086-75d9-4e46-8bda-c5e6b81884f8',66,'Amex',20866,'PORT ALBERNI AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32L66',58200,1461,3200000,'23592320',' '),
	        ('c551cd1d-3eec-4f44-b837-88077d3ab772',66,'Debit',20266,'PORT ALBERNI DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32L66',58200,1461,3200000,'22043810',' '),
	        ('24ad8677-e0c1-49aa-9263-d0ba36527d32',66,'Mastercard',20466,'PORT ALBERNI MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32L66',58200,1461,3200000,'22043810',' '),
	        ('66640cd3-d4de-43f6-8884-7612ab698a6b',66,'Visa',20666,'PORT ALBERNI-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32L66',58200,1461,3200000,'22043810',' '),
	        ('e563ce95-7cb0-460b-bf28-d70c6e58e7c5',64,'Bank',20064,'PORT HARDY',70,'SERVICE BC                              ',74,'32L64',58200,1461,3200000,'Bank',' '),
	        ('eacb518a-386c-4b39-9714-2e944cf45a8c',64,'Amex',20864,'PORT HARDY AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32L64',58200,1461,3200000,'23592338',' '),
	        ('a0aa9366-96dc-4072-8a28-d4c1b5a71a32',64,'Debit',20264,'PORT HARDY DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32L64',58200,1461,3200000,'22043828',' '),
	        ('49dbc115-6f88-4e46-93cc-afcb4de2a92e',64,'Mastercard',20464,'PORT HARDY MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32L64',58200,1461,3200000,'22043828',' '),
	        ('e3324d48-90dc-41f0-b47b-6cec4cd57ddf',64,'Visa',20664,'PORT HARDY-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32L64',58200,1461,3200000,'22043828',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('07f76415-3ec8-4160-a968-e8d3ca5b5081',67,'Bank',20067,'POWELL RIVER',70,'SERVICE BC                              ',74,'32L67',58200,1461,3200000,'Bank',' '),
	        ('444f72e9-d231-4d03-807f-a91f86355235',67,'Amex',20867,'POWELL RIVER AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32L67',58200,1461,3200000,'23592346',' '),
	        ('28df0f93-ad00-4732-90f3-99b5deb449fc',67,'Debit',20267,'POWELL RIVER DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32L67',58200,1461,3200000,'22043836',' '),
	        ('35287230-9b4a-41be-8d2f-7148fe1b8e9e',67,'Mastercard',20467,'POWELL RIVER MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32L67',58200,1461,3200000,'22043836',' '),
	        ('545fc3e0-c6e2-4713-893f-c512e0ff0bec',67,'Visa',20667,'POWELL RIVER-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32L67',58200,1461,3200000,'22043836',' '),
	        ('af7755af-cedd-449d-8b22-23c8b45b1125',68,'Bank',20068,'PRINCE GEORGE',70,'SERVICE BC                              ',74,'32H68',58200,1461,3200000,'Bank',' '),
	        ('2e7808e6-7225-4e31-b2e3-1fed5f49bf05',68,'Amex',20868,'PRINCE GEORGE AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32H68',58200,1461,3200000,'23592353',' '),
	        ('b84ad7bb-5518-47ba-8878-6aa45449f7a1',68,'Debit',20268,'PRINCE GEORGE DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32H68',58200,1461,3200000,'22043893',' '),
	        ('2bc09aab-d15f-4bf4-946b-1018943e6dd7',68,'Mastercard',20468,'PRINCE GEORGE MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32H68',58200,1461,3200000,'22043893',' '),
	        ('bbdb7f05-5a24-4c2a-9d37-8721e1b19094',68,'Visa',20668,'PRINCE GEORGE-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32H68',58200,1461,3200000,'22043893',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('09cb4f4e-8740-4d39-af5c-4376e26c9e36',69,'Bank',20069,'PRINCE RUPERT',70,'SERVICE BC                              ',74,'32J69',58200,1461,3200000,'Bank',' '),
	        ('c747025e-5828-481a-9c18-d998c12f53ee',69,'Amex',20869,'PRINCE RUPERT AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32J69',58200,1461,3200000,'23592361',' '),
	        ('664f7ba2-8706-431a-aa1b-541cae9c329b',69,'Debit',20269,'PRINCE RUPERT DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32J69',58200,1461,3200000,'22043919',' '),
	        ('2b7bb015-ecf6-41a4-8899-76996bc67023',69,'Mastercard',20469,'PRINCE RUPERT MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32J69',58200,1461,3200000,'22043919',' '),
	        ('873d83cd-9388-4102-b14a-132d2d198aef',69,'Visa',20669,'PRINCE RUPERT-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32J69',58200,1461,3200000,'22043919',' '),
	        ('f0e9218c-46aa-44a5-b525-bc92872e325f',70,'Bank',20070,'PRINCETON',70,'SERVICE BC                              ',74,'32G70',58200,1461,3200000,'Bank',' '),
	        ('9b924ab7-f5b7-458f-b103-bda1900f4d4e',70,'Amex',20870,'PRINCETON AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32G70',58200,1461,3200000,'23592379',' '),
	        ('7c6e1b20-06c3-4aea-8f6f-5d38f7c2ab4e',70,'Debit',20270,'PRINCETON DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32G70',58200,1461,3200000,'22043984',' '),
	        ('c3d919fd-0320-41c0-8b8c-7fe9c2b2258f',70,'Mastercard',20470,'PRINCETON MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32G70',58200,1461,3200000,'22043984',' '),
	        ('57409afe-9655-4819-a928-dcb97e6da8d5',70,'Visa',20670,'PRINCETON-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32G70',58200,1461,3200000,'22043984',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('641fd020-8f98-484e-81ba-3a076a8d14e6',73,'Bank',20073,'QUEEN CHARLOTTE',70,'SERVICE BC                              ',74,'32J73',58200,1461,3200000,'Bank',' '),
	        ('a358faf1-1f45-4c16-ac77-f1456ccf96f4',73,'Amex',20873,'QUEEN CHARLOTTE AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32J73',58200,1461,3200000,'23592387',' '),
	        ('5f3a9f89-d611-4fcf-98aa-f7b997c468f8',73,'Visa',20673,'QUEEN CHARLOTTE CITY-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32J73',58200,1461,3200000,'22044008',' '),
	        ('5014f1dd-4f14-4988-81a7-c42ed1d615b5',73,'Debit',20273,'QUEEN CHARLOTTE DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32J73',58200,1461,3200000,'22044008',' '),
	        ('013962ce-17d3-4a5b-b874-35eab41a69ec',73,'Mastercard',20473,'QUEEN CHARLOTTE MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32J73',58200,1461,3200000,'22044008',' '),
	        ('11e6c376-820c-4566-82ce-dda12db65c5d',75,'Bank',20075,'QUESNEL',70,'SERVICE BC                              ',74,'32H75',58200,1461,3200000,'Bank',' '),
	        ('4aab0cf6-b316-4daf-9552-84feede5d13f',75,'Amex',20875,'QUESNEL AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32H75',58200,1461,3200000,'23592395',' '),
	        ('9045c456-e740-4d49-bfa7-77651c742f6e',75,'Debit',20275,'QUESNEL DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32H75',58200,1461,3200000,'22044164',' '),
	        ('8829cdeb-9e81-4e1e-bab4-980b0e85d443',75,'Mastercard',20475,'QUESNEL MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32H75',58200,1461,3200000,'22044164',' '),
	        ('2c99a707-484a-46fb-bdd8-22afab0ad708',75,'Visa',20675,'QUESNEL-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32H75',58200,1461,3200000,'22044164',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('da82996b-0b24-40da-93bc-d7edf7f20cc6',80,'Bank',20080,'REVELSTOKE',70,'SERVICE BC                              ',74,'32G80',58200,1461,3200000,'Bank',' '),
	        ('adc9ab78-ae71-48d9-9040-6ee9e5fc95ed',80,'Amex',20880,'REVELSTOKE AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32G80',58200,1461,3200000,'23592403',' '),
	        ('b8009564-dd82-49dd-bc6f-4670aae6a783',80,'Debit',20280,'REVELSTOKE DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32G80',58200,1461,3200000,'22044230',' '),
	        ('31859f13-2968-471a-b7ff-0d3657d05aca',80,'Mastercard',20480,'REVELSTOKE MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32G80',58200,1461,3200000,'22044230',' '),
	        ('3725d2ac-ceca-4b72-b33e-5425d0dd05aa',80,'Visa',20680,'REVELSTOKE-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32G80',58200,1461,3200000,'22044230',' '),
	        ('8a2abe3c-f6ac-4efe-9ebd-9548960795d5',85,'Bank',20085,'SALMON ARM',70,'SERVICE BC                              ',74,'32G85',58200,1461,3200000,'Bank',' '),
	        ('ad2a66d2-3540-4d3f-979c-06f529c6c695',85,'Amex',20885,'SALMON ARM AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32G85',58200,1461,3200000,'23592411',' '),
	        ('117c4310-d368-4171-a045-06ac60b491c2',85,'Debit',20285,'SALMON ARM DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32G85',58200,1461,3200000,'22044255',' '),
	        ('caef7ed7-eed4-41d1-afbe-84d1f9e6bbba',85,'Mastercard',20485,'SALMON ARM MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32G85',58200,1461,3200000,'22044255',' '),
	        ('a01e49d2-b2db-4673-86b4-87307208433f',85,'Visa',20685,'SALMON ARM-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32G85',58200,1461,3200000,'22044255',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('902eb604-2564-46b0-b604-2dcb8d517655',82,'Bank',20101,'SECHELT',70,'SERVICE BC                              ',74,'32L82',58200,1461,3200000,'Bank',' '),
	        ('236efdf2-1bd2-4821-9531-aa2e00ba4077',82,'Amex',20882,'SECHELT AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32L82',58200,1461,3200000,'23592429',' '),
	        ('ef1faff0-f0dc-464b-a00a-9b308c7e162d',82,'Debit',20282,'SECHELT DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32L82',58200,1461,3200000,'22044297',' '),
	        ('0092c825-a0c7-4999-a08f-44ffd3c9a80b',82,'Mastercard',20482,'SECHELT MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32L82',58200,1461,3200000,'22044297',' '),
	        ('f9886b90-65d9-4d16-8026-639032033774',82,'Visa',20682,'SECHELT-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32L82',58200,1461,3200000,'22044297',' '),
	        ('3b5e6fe8-142e-4009-8b0d-b67dca66afd1',86,'Bank',20086,'SMITHERS',70,'SERVICE BC                              ',74,'32J86',58200,1461,3200000,'Bank',' '),
	        ('055fa043-463a-4945-8775-b655aa498f68',86,'Amex',20886,'SMITHERS AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32J86',58200,1461,3200000,'23592437',' '),
	        ('59867758-c7c3-4cf3-a688-275d19c50613',86,'Debit',20286,'SMITHERS DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32J86',58200,1461,3200000,'22044305',' '),
	        ('72d88155-1270-4026-a841-16a93cf21a21',86,'Mastercard',20486,'SMITHERS MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32J86',58200,1461,3200000,'22044305',' '),
	        ('a1403a33-5a46-44de-be3a-89581836a756',86,'Visa',20686,'SMITHERS-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32J86',58200,1461,3200000,'22044305',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('a9ba3287-db34-41ff-8403-ec73800665ff',83,'Bank',20083,'SPARWOOD',70,'SERVICE BC                              ',74,'32F83',58200,1461,3200000,'Bank',' '),
	        ('6c700ff8-2801-4ae1-aaa3-43cfa8d1b1f7',83,'Amex',20883,'SPARWOOD AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32F83',58200,1461,3200000,'23592445',' '),
	        ('23012dd6-f537-4fe4-975c-f9839a86fb53',83,'Debit',20283,'SPARWOOD DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32F83',58200,1461,3200000,'22044313',' '),
	        ('1d7e98b8-951c-40c9-9715-89dc2925ac40',83,'Mastercard',20483,'SPARWOOD MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32F83',58200,1461,3200000,'22044313',' '),
	        ('2017d148-14d3-40ef-81fb-9d6ec42c92d5',83,'Visa',20683,'SPARWOOD-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32F83',58200,1461,3200000,'22044313',' '),
	        ('5c8848ed-033b-4349-9bda-92021a03639c',84,'Bank',20084,'SQUAMISH',70,'SERVICE BC                              ',74,'32L84',58200,1461,3200000,'Bank',' '),
	        ('0dbcdaea-7c1a-4899-8977-a82a25738fbb',84,'Amex',20884,'SQUAMISH AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32L84',58200,1461,3200000,'23592452',' '),
	        ('c7b3ccd1-514b-4c00-b6af-bf6246694081',84,'Debit',20284,'SQUAMISH DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32L84',58200,1461,3200000,'22044362',' '),
	        ('b88fae78-9f28-4a00-be11-bfd663cdbede',84,'Mastercard',20484,'SQUAMISH MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32L84',58200,1461,3200000,'22044362',' '),
	        ('5adedabf-d52b-483f-b368-063cd443bc02',84,'Visa',20684,'SQUAMISH-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32L84',58200,1461,3200000,'22044362',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('d0784cf4-2975-4369-8274-7b2b47137b2b',87,'Bank',20087,'STEWART',70,'SERVICE BC                              ',74,'32J87',58200,1461,3200000,'Bank',' '),
	        ('b5cf7268-749f-44b8-b334-01e512dadafd',87,'Amex',20887,'STEWART AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32J87',58200,1461,3200000,'23592460',' '),
	        ('e8b830e4-3a0b-45f6-b92c-c257c01c015d',87,'Debit',20287,'STEWART DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32J87',58200,1461,3200000,'22044412',' '),
	        ('6e709bfd-542e-4397-b11c-13f0d781e494',87,'Mastercard',20487,'STEWART MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32J87',58200,1461,3200000,'22044412',' '),
	        ('ce91803d-5d1b-4daa-bffe-3d2f2a1723e7',87,'Visa',20687,'STEWART-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32J87',58200,1461,3200000,'22044412',' '),
	        ('0a2d53dc-bf8a-4c10-b624-4f2e714048d6',88,'Bank',20088,'TERRACE',70,'SERVICE BC                              ',74,'32J88',58200,1461,3200000,'Bank',' '),
	        ('69ce32c8-4bed-4387-8e3d-ceb4daa1c63e',88,'Amex',20888,'TERRACE AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32J88',58200,1461,3200000,'23592478',' '),
	        ('2cbb278d-3156-4c5e-ad26-aeb53728adb1',88,'Debit',20288,'TERRACE DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32J88',58200,1461,3200000,'22044438',' '),
	        ('37a29a6d-f984-41de-9056-dc31e3c9ac93',88,'Mastercard',20488,'TERRACE MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32J88',58200,1461,3200000,'22044438',' '),
	        ('a5f4f392-f775-4634-ae1a-15192b836718',88,'Visa',20688,'TERRACE-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32J88',58200,1461,3200000,'22044438',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('a66f2181-e925-46e4-9ec2-2576712cfb62',81,'Bank',20081,'TRAIL',70,'SERVICE BC                              ',74,'32F81',58200,1461,3200000,'Bank',' '),
	        ('12294adc-e92b-4ec5-b5de-8da3fde9b4d7',81,'Amex',20881,'TRAIL AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32F81',58200,1461,3200000,'23592486',' '),
	        ('87d26650-a03c-42ff-b4b0-fc858565f934',81,'Debit',20281,'TRAIL DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32F81',58200,1461,3200000,'22044545',' '),
	        ('a4ebaa5c-4e92-44a4-86f9-fb1159d21e79',81,'Mastercard',20481,'TRAIL MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32F81',58200,1461,3200000,'22044545',' '),
	        ('652c48d9-787b-4a95-8a9e-a4b48e07cde8',81,'Visa',20681,'TRAIL-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32F81',58200,1461,3200000,'22044545',' '),
	        ('82e00ea1-a986-4ab7-8b9c-6e455c9b4426',89,'Bank',20089,'UCLUELET',70,'SERVICE BC                              ',74,'32L89',58200,1461,3200000,'Bank',' '),
	        ('72da9c96-8154-4635-86ce-81876fabdec6',89,'Amex',20889,'UCLUELET AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32L89',58200,1461,3200000,'23592494',' '),
	        ('51a76cbf-159c-4ff4-91ae-c1cfcf5318ad',89,'Debit',20289,'UCLUELET DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32L89',58200,1461,3200000,'22044628',' '),
	        ('2fe87734-c2ff-4fa5-828d-bb5c8535a3d8',89,'Mastercard',20489,'UCLUELET MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32L89',58200,1461,3200000,'22044628',' '),
	        ('a8109b0d-93b0-4dd9-8ca2-17fa6c0d9032',89,'Visa',20689,'UCLUELET-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32L89',58200,1461,3200000,'22044628',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('e918a883-9fa0-41f6-9c82-8d46c939b2db',91,'Bank',20091,'VALEMOUNT',70,'SERVICE BC                              ',74,'32H91',58200,1461,3200000,'Bank',' '),
	        ('5be84904-abfd-4af1-8bcc-caab82c64718',91,'Amex',20891,'VALEMOUNT AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32H91',58200,1461,3200000,'23592502',' '),
	        ('6e696aea-fd2a-4b7f-a295-0649d6df66cb',91,'Debit',20291,'VALEMOUNT DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32H91',58200,1461,3200000,'22044701',' '),
	        ('ad2c3c18-a47c-40ca-ab28-bbd07ca65fd8',91,'Mastercard',20491,'VALEMOUNT MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32H91',58200,1461,3200000,'22044701',' '),
	        ('96ad3ae0-47f3-4e8f-84f6-c88340737201',91,'Visa',20691,'VALEMOUNT-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32H91',58200,1461,3200000,'22044701',' '),
	        ('94347343-183c-4bc2-a3d2-6aa04045d043',92,'Bank',20092,'VANDERHOOF',70,'SERVICE BC                              ',74,'32H92',58200,1461,3200000,'Bank',' '),
	        ('ec433bb2-67fe-4464-9743-42cd58937760',92,'Amex',20892,'VANDERHOOF AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32H92',58200,1461,3200000,'23592510',' '),
	        ('b50a34d1-37bc-45a0-b72e-106192fd3e16',92,'Debit',20292,'VANDERHOOF DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32H92',58200,1461,3200000,'22044750',' '),
	        ('bdd56169-e822-429e-850e-6e983acd480e',92,'Mastercard',20492,'VANDERHOOF MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32H92',58200,1461,3200000,'22044750',' '),
	        ('63e68a1d-f792-44cd-b87e-d4f493dad01c',92,'Visa',20692,'VANDERHOOF-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32H92',58200,1461,3200000,'22044750',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('d97a3fa8-e6c6-42b5-8d0f-ae9e2467973a',93,'Bank',20093,'VERNON',70,'SERVICE BC                              ',74,'32G93',58200,1461,3200000,'Bank',' '),
	        ('2ccaf48a-2dba-4e3d-9fec-61940ea6099c',93,'Amex',20893,'VERNON AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32G93',58200,1461,3200000,'23592528',' '),
	        ('88d4da23-e692-43f6-ae79-f1376129d98f',93,'Debit',20293,'VERNON DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32G93',58200,1461,3200000,'22044859',' '),
	        ('3f61486a-fe55-409d-a465-146fe383e545',93,'Mastercard',20493,'VERNON MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32G93',58200,1461,3200000,'22044859',' '),
	        ('11ab6eed-b2cb-4c05-9771-ac1e2f23147f',93,'Visa',20693,'VERNON-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32G93',58200,1461,3200000,'22044859',' '),
	        ('f00d4c68-528f-486f-aecd-c367e6801250',94,'Bank',20094,'VICTORIA',70,'SERVICE BC                              ',74,'32L94',58200,1461,3200000,'Bank',' '),
	        ('e04e5bf2-008a-4fef-8151-5acd6c313c7f',94,'Amex',20898,'VICTORIA AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32L94',58200,1461,3200000,'23759473',' '),
	        ('7b680f71-14ca-475a-83c1-0b935e18d977',94,'Debit',20298,'VICTORIA DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32L94',58200,1461,3200000,'20777441',' '),
	        ('823f7bae-0bd0-4f23-b5f4-06088cf8d796',94,'Mastercard',20498,'VICTORIA MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32L94',58200,1461,3200000,'20777441',' '),
	        ('3422d5d5-37bb-4fd4-8dff-09c06a781f60',94,'Visa',20698,'VICTORIA VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32L94',58200,1461,3200000,'20777441',' ');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('bd0d72c7-a451-48ba-b28f-ab41d216bfdd',97,'Bank',20097,'WILLIAMS LAKE',70,'SERVICE BC                              ',74,'32H97',58200,1461,3200000,'Bank',' '),
	        ('44a8756a-6fa0-48b3-ad72-0cbf7c99e2b5',97,'Amex',20897,'WILLIAMS LAKE AMEX POS',503,'SERVICE BC AMEX POS                     ',74,'32H97',58200,1461,3200000,'23592536',' '),
	        ('7f61f138-78d8-49e4-baf7-504b2905bf44',97,'Debit',20297,'WILLIAMS LAKE DEBIT POS',1331,'SERVICE BC DEBIT POS                    ',74,'32H97',58200,1461,3200000,'22044933',' '),
	        ('bb99adc4-fb6c-49eb-98f8-2faaac4a2401',97,'Mastercard',20497,'WILLIAMS LAKE MASTERCARD POS',315,'SERVICE BC M/C POS                      ',74,'32H97',58200,1461,3200000,'22044933',' '),
	        ('3b45cd2a-b8c1-4a25-836c-d0ecce9e74ae',97,'Visa',20697,'WILLIAMS LAKE-VISA POS',1339,'SERVICE BC VISA POS                     ',74,'32H97',58200,1461,3200000,'22044933',' '),
	        ('bddb3fa7-0abb-40b6-ba78-107b6d8cc150',52,'Bank',90510,'MOBILE OUTREACH CHILLIWACK',70,'SERVICE BC                              ',74,'32F52',58200,1461,3200142,'Bank','SBC Mobile FSSS'),
	        ('2ef0475e-39f7-41eb-a21d-b3d4a25f1422',52,'Debit',90522,'SBC MOBILE OUTREACH DEBIT',1331,'SERVICE BC DEBIT POS                    ',74,'32F52',58200,1461,3200142,'24103846','SBC Mobile FSSS'),
	        ('8d42c603-6e72-44bf-97a7-b917a59883ec',52,'Amex',90523,'SBC MOBILE OUTREACH POS AMEX',503,'SERVICE BC AMEX POS                     ',74,'32F52',58200,1461,3200142,'93683283','SBC Mobile FSSS'),
	        ('3c196b9d-4ef2-4efe-8e00-08c30ec16974',52,'Mastercard',90521,'SBC MOBILE OUTREACH POS M/C',315,'SERVICE BC M/C POS                      ',74,'32F52',58200,1461,3200142,'24103846','SBC Mobile FSSS'),
	        ('95c82927-564f-478b-b863-43c93b1235b9',52,'Visa',90520,'SBC MOBILE OUTREACH POS VISA',1339,'SERVICE BC VISA POS                     ',74,'32F52',58200,1461,3200142,'24103846','SBC Mobile FSSS');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('5ee1b035-f46e-4e07-903e-e6c7ffafb069',62,'Bank',90514,'MOBILE OUTREACH SURREY',70,'SERVICE BC                              ',74,'32F62',58200,1461,3200142,'Bank','SBC Mobile GVA'),
	        ('08a19e90-324b-49c3-9fbd-a540988ee646',62,'Amex',90539,'SBC MOBILE OUTREACH POS AMEX',503,'SERVICE BC AMEX POS                     ',74,'32F62',58200,1461,3200142,'93683143','SBC Mobile GVA'),
	        ('60e64526-1fe3-4865-a703-2e63189f92ad',62,'Debit',90538,'SBC MOBILE OUTREACH POS DEBIT',1331,'SERVICE BC DEBIT POS                    ',74,'32F62',58200,1461,3200142,'24103838','SBC Mobile GVA'),
	        ('6f814d1a-22ed-4da8-b400-65dc3689b109',62,'Mastercard',90537,'SBC MOBILE OUTREACH POS M/C',315,'SERVICE BC M/C POS                      ',74,'32F62',58200,1461,3200120,'24103838','SBC Mobile GVA'),
	        ('cd9b578f-556f-4ac7-8d6c-dc1c89e6f120',62,'Visa',90536,'SBC MOBILE OUTREACH POS VISA',1339,'SERVICE BC VISA POS                     ',74,'32F62',58200,1461,3200142,'24103838','SBC Mobile GVA'),
	        ('990ea627-a05f-4bdb-a149-69926c3c5a8a',53,'Bank',90511,'MOBILE OUTREACH CRANBROOK',70,'SERVICE BC                              ',74,'32F53',58200,1461,3200142,'Bank','SBC Mobile KP'),
	        ('3d6889de-8607-4ef0-afed-e02b43c7f035',53,'Amex',90527,'SBC MOBILE OUTREACH POS AMEX',503,'SERVICE BC AMEX POS                     ',74,'32F53',58200,1461,3200142,'93683267','SBC Mobile KP'),
	        ('598b727f-4eee-416a-a958-3f95804015c0',53,'Debit',90526,'SBC MOBILE OUTREACH POS DEBIT',1331,'SERVICE BC DEBIT POS                    ',74,'32F53',58200,1461,3200142,'24103895','SBC Mobile KP'),
	        ('128b2714-b11b-4b29-b6f3-3f387dc7ed26',53,'Mastercard',90525,'SBC MOBILE OUTREACH POS M/C',315,'SERVICE BC M/C POS                      ',74,'32F53',58200,1461,3200142,'24103895','SBC Mobile KP'),
	        ('d662040c-4f28-455d-9386-15899c7c9d8e',53,'Visa',90524,'SBC MOBILE OUTREACH POS VISA',1339,'SERVICE BC VISA POS                     ',74,'32F53',58200,1461,3200142,'24103895','SBC Mobile KP');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('5a1fb5c7-6708-4af6-9207-8b406f360ee0',59,'Bank',90515,'MOBILE OUTREACH VANDERHOOF',70,'SERVICE BC                              ',74,'32F59',58200,1461,3200142,'Bank','SBC Mobile NCCI'),
	        ('8d7f3a49-9460-4a9f-a2db-0d7c6d5aa0f8',59,'Amex',90543,'SBC MOBILE OUTREACH POS AMEX',503,'SERVICE BC AMEX POS                     ',74,'32F59',58200,1461,3200142,'93683176','SBC Mobile NCCI'),
	        ('ff1098ce-d84d-48fa-a3af-2018a527741c',59,'Debit',90542,'SBC MOBILE OUTREACH POS DEBIT',1331,'SERVICE BC DEBIT POS                    ',74,'32F59',58200,1461,3200142,'24103879','SBC Mobile NCCI'),
	        ('16f230c6-233e-42d7-9c68-e07f89cf101d',59,'Mastercard',90541,'SBC MOBILE OUTREACH POS M/C',315,'SERVICE BC M/C POS                      ',74,'32F59',58200,1461,3200142,'24103879','SBC Mobile NCCI'),
	        ('aa247c09-ccce-465f-828e-56011c1d5f30',59,'Visa',90540,'SBC MOBILE OUTREACH POS VISA',1339,'SERVICE BC VISA POS                     ',74,'32F59',58200,1461,3200142,'24103879','SBC Mobile NCCI'),
	        ('c2ad82a0-1246-4f1d-b2e2-a6006cadaf31',57,'Bank',90513,'MOBILE OUTREACH KAMLOOPS',70,'SERVICE BC                              ',74,'32F57',58200,1461,3200142,'Bank','SBC Mobile TOCK'),
	        ('e897c861-3ac5-4154-a33a-5f1ecb6bade6',57,'Amex',90535,'SBC MOBILE OUTREACH POS AMEX',503,'SERVICE BC AMEX POS                     ',74,'32F57',58200,1461,3200142,'93683275','SBC Mobile TOCK'),
	        ('7a942ae9-5bb4-42a4-80b4-c624e643957e',57,'Debit',90534,'SBC MOBILE OUTREACH POS DEBIT',1331,'SERVICE BC DEBIT POS                    ',74,'32F57',58200,1461,3200142,'24103861','SBC Mobile TOCK'),
	        ('f51a96b9-fd56-4bbf-9d9e-d7831b60b66b',57,'Visa',90532,'SBC MOBILE OUTREACH POS VISA',1339,'SERVICE BC VISA POS                     ',74,'32F57',58200,1461,3200142,'24103861','SBC Mobile TOCK'),
	        ('a878ad8d-538f-4ede-a71d-ee06a4d36049',57,'Visa',90533,'SBC MOBILE OUTREACH POS VISA',1339,'SERVICE BC VISA POS                     ',74,'32F57',58200,1461,3200142,'24103861','SBC Mobile TOCK');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('9b37f64e-9404-4c80-ab86-5c90ffe08abe',54,'Bank',90512,'MOBILE OUTREACH DUNCAN',70,'SERVICE BC                              ',74,'32F54',58200,1461,3200142,'Bank','SBC Mobile VI'),
	        ('a56a1860-5a4a-4450-ad97-82d19a76cc12',54,'Mastercard',90529,'SBC MOBILE OUREACH POS M/C',315,'SERVICE BC M/C POS                      ',74,'32F54',58200,1461,3200142,'24103853','SBC Mobile VI'),
	        ('0ed4ca59-e5e7-4e00-96f3-f05a41a7e9d0',54,'Amex',90531,'SBC MOBILE OUTREACH POS AMEX',503,'SERVICE BC AMEX POS                     ',74,'32F54',58200,1461,3200142,'93683184','SBC Mobile VI'),
	        ('c4596d5d-52ca-4acc-ada5-0a5a8a1e34ba',54,'Debit',90530,'SBC MOBILE OUTREACH POS DEBIT',1331,'SERVICE BC DEBIT POS                    ',74,'32F54',58200,1461,3200142,'24103853','SBC Mobile VI'),
	        ('5f30c4ba-f88f-42fa-b95d-6084788fe5f9',54,'Visa',90528,'SBC MOBILE OUTREACH POS VISA',1339,'SERVICE BC VISA POS                     ',74,'32F54',58200,1461,3200142,'24103853','SBC Mobile VI'),
	        ('eb365042-d652-40cf-bffa-abea41a15bd7',96,'Bank',90509,'MOBILE OUTREACH WEST KELOWNA',70,'SERVICE BC                              ',74,'32F96',58200,1461,3200142,'Bank','SBC Mobile West Kel'),
	        ('ccb6d112-c71a-4264-9430-f4e519c2023c',96,'Amex',90519,'SBC MOBILE OUTREACH POS AMEX',503,'SERVICE BC AMEX POS                     ',74,'32F96',58200,1461,3200142,'93683226','SBC Mobile West Kel'),
	        ('cba843a7-e1e0-43b1-adac-652da5067e5f',96,'Debit',90518,'SBC MOBILE OUTREACH POS DEBIT',1331,'SERVICE BC DEBIT POS                    ',74,'32F96',58200,1461,3200142,'24103887','SBC Mobile West Kel'),
	        ('9d4a7769-8c78-4051-9ee9-f68631d3592c',96,'Mastercard',90517,'SBC MOBILE OUTREACH POS M/C',315,'SERVICE BC M/C POS                      ',74,'32F96',58200,1461,3200142,'24103887','SBC Mobile West Kel'),
	        ('d223b78d-d7e1-4138-9cf4-92f9d387ac3b',96,'Visa',90516,'SBC MOBILE OUTREACH POS VISA',1339,'SERVICE BC VISA POS                     ',74,'32F96',58200,1461,3200142,'24103887','SBC Mobile West Kel');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('6d788dfd-f5aa-49de-b0ab-159db5b056d1',60521,'VisaDebit',60521,'PROVINCIAL NOMINEE PROG VISA/DEBIT POS  ',1355,'PROVINCIAL NOMINEE PROG VISA/DEBIT POS  ',60,'51781',22459,9002,5100000,'22046268','Z. Labour'),
	        ('07b104fc-a64f-4176-a773-efe71778fd25',60522,'Amex',60522,'PROVINCIAL NOMINEE PROGRAM AMEX POS     ',519,'PROVINCIAL NOMINEE PROGRAM AMEX POS     ',60,'51781',22459,9002,5100000,'23705922','Z. Labour'),
	        ('92f10d54-ada5-45e2-afa2-f9e14a2668a4',60520,'Mastercard',60520,'PROVINCIAL NOMINEE PROGRAM M/C POS      ',338,'PROVINCIAL NOMINEE PROGRAM M/C POS      ',60,'51781',22459,9002,5100000,'22046268','Z. Labour'),
	        ('e8b8b376-7e1e-42ef-8293-c2aad0f0b2ae',44005,'Bank',44005,'EMPLOYMENT STANDARDS - VICTORIA         ',161,'EMPLOYMENT STANDARDS                    ',0,'51650',53702,4798,5155555,'Bank','Z. Labour'),
	        ('ed4d8052-8acf-4aba-9319-153f69fae472',44018,'Visa',44018,'TALENT AGENCY LICENCING INTERNET VISA   ',627,'EMPLOYMENT STANDARDS BR INTERNET VISA   ',0,'51650',53702,4798,5155555,'23700609','Z. Labour'),
	        ('903689db-edfe-4349-999d-484784f2faa8',44019,'VisaDebit',44019,'TALENT AGENCY LICENCING INT VISA DEBIT  ',628,'EMPLOYMENT STANDARDS BR INT VISA DEBIT  ',0,'51650',53702,4798,5155555,'23700609','Z. Labour'),
	        ('e88bae31-68b3-4e0c-801d-6b69d96637c5',44020,'Mastercard',44020,'TALENT AGENCY LICENCING INTERNET M/C    ',629,'EMPLOYMENT STANDARDS BR INTERNET M/C    ',0,'51650',53702,4798,5155555,'23700609','Z. Labour'),
	        ('2ee02ce3-89fd-45c3-b7ff-36993a7f4a8b',44021,'MastercardDebit',44021,'TALENT AGENCY LICENCING INT DEBIT M/C   ',630,'EMPLOYMENT STANDARDS BR INT DEBIT M/C   ',0,'51650',53702,4798,5155555,'23700609','Z. Labour'),
	        ('08263eb4-6363-430b-84c1-83c06b9b64b1',44602,'Visa',44602,'EMPLOYMENT STANDARDS TRUST ICEPAY VISA  ',672,'EMPLOYMENT STANDARDS ICEPAY VISA        ',0,'51650',53702,4798,5155555,'23956599','Z. Labour'),
	        ('7015f265-36a8-4f85-9157-7926e238891d',44603,'VisaDebit',44603,'EMPLOYMENT STANDARDS TRUST ICEPAY VSADBT',673,'EMPLOYMENT STANDARDS ICEPAY VISADEBIT   ',0,'51650',53702,4798,5155555,'23956599','Z. Labour');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('9a143814-1431-4244-8a89-9078253029d5',44604,'Mastercard',44604,'EMPLOYMENT STANDARDS TRUST ICEPAY M/C   ',674,'EMPLOYMENT STANDARDS ICEPAY M/C         ',0,'51650',53702,4798,5155555,'23956599','Z. Labour'),
	        ('0fb69a86-ad28-4697-89e1-15c36848a834',44605,'MastercardDebit',44605,'EMPLOYMENT STANDARDS TRUST ICEPAY DBT MC',675,'EMPLOYMENT STANDARDS ICEPAY DEBIT M/C   ',0,'51650',53702,4798,5155555,'23956599','Z. Labour'),
	        ('776506bd-1032-4b1b-a50a-98e1de3de160',60262,'Amex',60262,'BC ATHLETIC COMMISSIONER AMEX POS       ',701,'BC ATHLETIC COMMISSIONER AMEX POS       ',126,'51662',55410,9002,5140021,'26264166','Z. Labour'),
	        ('6137b982-76b0-44ea-8c53-b8aa6b597e1a',60261,'Mastercard',60261,'BC ATHLETIC COMMISSIONER M/C POS        ',700,'BC ATHLETIC COMMISSIONER M/C POS        ',126,'51662',55410,9002,5140021,'23394163','Z. Labour'),
	        ('ab40de09-47bb-44a2-8692-ca28468589e2',60263,'VisaDebit',60263,'BC ATHLETIC COMMISSIONER VISA/DEBIT POS ',702,'BC ATHLETIC COMMISSIONER VISA POS       ',126,'51662',55410,9002,5140021,'23394163','Z. Labour'),
	        ('e5322df8-244f-4b44-8510-0f18a54d2494',62719,'Bank',62719,'REVENUE-VICTORIA                        ',112,'LABOUR GENERAL                          ',127,'51622',52300,4581,5155555,'Bank','Z. Labour'),
	        ('4011f8af-533f-4c8a-97e6-345a205f0337',44016,'Mastercard',44016,'EMPLOYMENT STDS BR VICTORIA-MC POS      ',541,'EMPLOYMENT STANDARDS BRANCH MC POS      ',127,'51622',52300,4581,5155555,'23302208','Z. Labour'),
	        ('b637e369-0268-4bfe-b28a-e2cf0c285e8a',44015,'Amex',44015,'EMPLOYMENT STDS BR VICTORIA-AMEX POS    ',542,'EMPLOYMENT STANDARDS BRANCH AMEX POS    ',127,'51622',52300,4581,5155555,'25276773','Z. Labour'),
	        ('ad8d1efc-da7c-48da-8228-157611d76a35',44017,'VisaDebit',44017,'EMPLOYMENT STDS BR VICTORIA-VSA/DBT POS ',543,'EMPLOYMENT STANDARDS BR VISADEBIT POS  ',127,'51622',52300,4581,5155555,'23302208','Z. Labour'),
	        ('bc11765e-ee3f-4abc-be21-395c7083e7f5',44597,'Visa',44597,'EMPLOYMENT STANDARDS ICEPAY VISA        ',672,'EMPLOYMENT STANDARDS ICEPAY VISA        ',127,'51622',52300,4581,5155555,'23956607','Z. Labour');
        `);
    await queryRunner.query(`
        INSERT INTO 
            public.master_location_data 
            (id,"GARMS Location","Type","Location",description,"Program","Program Description","Min Client","Responsibility Code","Service Line",stob,"Project No.","Merchant ID",notes) 
        VALUES
	        ('525b77f1-47f8-4fd5-ac5e-b5da236851ff',44598,'VisaDebit',44598,'EMPLOYMENT STANDARDS ICEPAY VISA DEBIT  ',673,'EMPLOYMENT STANDARDS ICEPAY VISADEBIT   ',127,'51622',52300,4581,5155555,'23956607','Z. Labour'),
	        ('449dbf2a-c381-4707-b929-897ee987b522',44599,'Mastercard',44599,'EMPLOYMENT STANDARDS ICEPAY M/C         ',674,'EMPLOYMENT STANDARDS ICEPAY M/C         ',127,'51622',52300,4581,5155555,'23956607','Z. Labour'),
	        ('135691ab-d33b-4033-a6eb-98a88d14f31d',44600,'MastercardDebit',44600,'EMPLOYMENT STANDARDS ICEPAY DEBIT M/C   ',675,'EMPLOYMENT STANDARDS ICEPAY DEBIT M/C   ',127,'51622',52300,4581,5155555,'23956607','Z. Labour'),
	        ('1f965cc2-fea7-458e-a14c-e6094c9eaeb9',44601,'Amex',44601,'EMPLOYMENT STANDARDS ICEPAY AMEX        ',676,'EMPLOYMENT STANDARDS ICEPAY AMEX        ',127,'51622',52300,4581,5155555,'91226713','Z. Labour - 3991226713'),
	        ('ac5934e9-46d3-42a1-a639-2824e442d585',44606,'Amex',44606,'EMPLOYMENT STANDARDS TRUST ICEPAY AMEX  ',676,'EMPLOYMENT STANDARDS ICEPAY AMEX        ',0,'51650',53702,4798,5155555,'91226721','Z. Labour - 3991226721'),
	        ('dadc6483-42f4-419e-9db8-32f08b635c75',44022,'Amex',44022,'TALENT AGENCY LICENCING INTERNET AMEX   ',631,'EMPLOYMENT STANDARDS BR INTERNET AMEX   ',0,'51650',53702,4798,5155555,'29266051','Z. Labour - 9329266051');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DELETE FROM
            public.master_location_data 
        `);
  }
}
